#!/usr/bin/env node

import { copyFile, mkdtemp, readFile, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const SIZE = 1200;
const KINDS = ['cinematic', 'dotted', 'hologram', 'paper', 'outline', 'wireframe'];
const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(siteRoot, 'public', 'home');

const args = process.argv.slice(2);
const checkOnly = args.length === 1 && args[0] === '--check';
if (args.length > 0 && !checkOnly) {
  throw new Error('Usage: node scripts/generate-world-posters.mjs [--check]');
}

const inspectWebp = async (page, file) => {
  const bytes = await readFile(file);
  if (bytes.subarray(0, 4).toString('ascii') !== 'RIFF' || bytes.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`${path.basename(file)} is not a WebP file.`);
  }

  const result = await page.evaluate(async ({ base64 }) => {
    const image = new Image();
    image.src = `data:image/webp;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('A 2D canvas context is unavailable.');
    context.drawImage(image, 0, 0);

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let alphaMin = 255;
    let alphaMax = 0;
    let transparentPixels = 0;
    let visiblePixels = 0;
    for (let index = 3; index < pixels.length; index += 4) {
      const alpha = pixels[index];
      alphaMin = Math.min(alphaMin, alpha);
      alphaMax = Math.max(alphaMax, alpha);
      if (alpha === 0) transparentPixels += 1;
      else visiblePixels += 1;
    }

    const alphaAt = (x, y) => pixels[(y * canvas.width + x) * 4 + 3];
    return {
      width: canvas.width,
      height: canvas.height,
      alphaMin,
      alphaMax,
      transparentPixels,
      visiblePixels,
      cornerAlpha: [
        alphaAt(0, 0),
        alphaAt(canvas.width - 1, 0),
        alphaAt(0, canvas.height - 1),
        alphaAt(canvas.width - 1, canvas.height - 1),
      ],
    };
  }, { base64: bytes.toString('base64') });

  if (result.width !== SIZE || result.height !== SIZE) {
    throw new Error(`${path.basename(file)} is ${result.width}x${result.height}; expected ${SIZE}x${SIZE}.`);
  }
  if (result.transparentPixels === 0 || result.alphaMin !== 0) {
    throw new Error(`${path.basename(file)} has no transparent pixels.`);
  }
  if (result.visiblePixels === 0 || result.alphaMax === 0) {
    throw new Error(`${path.basename(file)} is fully transparent.`);
  }
  if (result.cornerAlpha.some((alpha) => alpha !== 0)) {
    throw new Error(`${path.basename(file)} has a non-transparent corner (${result.cornerAlpha.join(', ')}).`);
  }

  return { ...result, bytes: bytes.length };
};

const report = (kind, result, verb) => {
  const kib = (result.bytes / 1024).toFixed(1);
  console.log(
    `${verb} world-${kind}.webp: ${result.width}x${result.height}, ${kib} KiB, ` +
    `alpha ${result.alphaMin}-${result.alphaMax}, corners ${result.cornerAlpha.join('/')}`,
  );
};

const checkExisting = async (page) => {
  for (const kind of KINDS) {
    const result = await inspectWebp(page, path.join(outputDirectory, `world-${kind}.webp`));
    report(kind, result, 'Checked');
  }
};

const generate = async (page) => {
  const coreDist = process.env.GLOBIOJS_LOCAL_CORE_DIST?.trim();
  if (!coreDist) {
    throw new Error('Set GLOBIOJS_LOCAL_CORE_DIST to a freshly built @globiojs/core dist directory.');
  }

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'globiojs-world-posters-'));
  let vite;
  try {
    vite = await createServer({
      root: siteRoot,
      configFile: path.join(siteRoot, 'vite.config.ts'),
      logLevel: 'warn',
      server: { host: '127.0.0.1', port: 0, strictPort: false },
    });
    await vite.listen();
    const baseUrl = vite.resolvedUrls?.local[0];
    if (!baseUrl) throw new Error('Vite did not expose a local capture URL.');

    page.on('console', (message) => {
      if (message.type() === 'warning' || message.type() === 'error') {
        console.error(`[capture:${message.type()}] ${message.text()}`);
      }
    });
    await page.goto(new URL('scripts/capture-worlds.html', baseUrl).href, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.captureLoaded === true);

    const captures = [];
    for (const kind of KINDS) {
      const rendered = await page.evaluate((nextKind) => window.renderWorld(nextKind), kind);
      if (rendered.width !== SIZE || rendered.height !== SIZE) {
        throw new Error(`Renderer for ${kind} is ${rendered.width}x${rendered.height}; expected ${SIZE}x${SIZE}.`);
      }

      const [download, encoded] = await Promise.all([
        page.waitForEvent('download'),
        page.evaluate(() => window.downloadWorld()),
      ]);
      const expectedName = `world-${kind}.webp`;
      if (download.suggestedFilename() !== expectedName || encoded.kind !== kind) {
        throw new Error(`Capture identity mismatch for ${kind}.`);
      }

      const temporaryFile = path.join(temporaryDirectory, expectedName);
      await download.saveAs(temporaryFile);
      const result = await inspectWebp(page, temporaryFile);
      report(kind, result, 'Rendered');
      captures.push({ kind, temporaryFile, target: path.join(outputDirectory, expectedName) });
    }

    const staged = [];
    try {
      for (const capture of captures) {
        const stage = `${capture.target}.next-${process.pid}`;
        await copyFile(capture.temporaryFile, stage);
        staged.push({ ...capture, stage });
      }
      for (const capture of staged) await rename(capture.stage, capture.target);
    } finally {
      await Promise.all(staged.map((capture) => rm(capture.stage, { force: true })));
    }
  } finally {
    try {
      await page.close();
    } finally {
      try {
        await vite?.close();
      } finally {
        await rm(temporaryDirectory, { recursive: true, force: true });
      }
    }
  }
};

let browser;
try {
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({
    viewport: { width: SIZE, height: SIZE },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
  });
  if (checkOnly) await checkExisting(page);
  else await generate(page);
} finally {
  await browser?.close();
}
