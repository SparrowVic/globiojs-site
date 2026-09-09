import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

/** Inspect final browser assets without ever including a credential in an error. */
export async function assertNoFontAwesomeTokenInAssets(directory, token) {
  const secrets = [...new Set([token, token?.trim()])].filter((value) => typeof value === 'string' && value.length > 0);
  if (secrets.length === 0) throw new Error('Cannot verify production assets without a Font Awesome Package Token.');
  const needles = secrets.map((value) => Buffer.from(value));
  const root = path.resolve(directory);
  const display = (filename) => secrets.reduce(
    (name, secret) => name.replaceAll(secret, '[redacted]'),
    path.relative(root, filename).split(path.sep).join('/') || '.',
  );
  let checked = 0;

  async function inspect(folder) {
    let entries;
    try {
      entries = await readdir(folder, { withFileTypes: true });
    } catch {
      throw new Error(`Could not inspect production asset directory: ${display(folder)}`);
    }
    for (const entry of entries) {
      const filename = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        await inspect(filename);
      } else if (entry.isFile()) {
        let contents;
        try {
          contents = await readFile(filename);
        } catch {
          throw new Error(`Could not inspect production asset: ${display(filename)}`);
        }
        if (needles.some((needle) => contents.includes(needle))) {
          throw new Error(`Font Awesome Package Token found in production asset: ${display(filename)}`);
        }
        checked += 1;
      } else {
        // Do not silently skip links that a deployment provider might dereference.
        throw new Error(`Unsupported production asset type: ${display(filename)}`);
      }
    }
  }

  await inspect(root);
  return checked;
}
