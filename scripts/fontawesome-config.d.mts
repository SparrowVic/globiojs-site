export const siteRoot: string;
export const proDirectory: string;
export function fontAwesomeMode(env?: Record<string, string | undefined>): 'free' | 'pro';
export function fontAwesomeAliases(env?: Record<string, string | undefined>): Record<string, string>;
export function withoutFontAwesomeCredentials(env?: Record<string, string | undefined>): Record<string, string | undefined>;
