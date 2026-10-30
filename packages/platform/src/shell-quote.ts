/**
 * Quoting helpers for the platform adapters. Names, paths and text reach the adapters from
 * user or AI commands, so they must never be spliced raw into a shell or AppleScript string.
 */

/** POSIX single-quote escaping: the result is always exactly one literal shell word. */
export function shq(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/**
 * Escapes text for use INSIDE an AppleScript double-quoted string literal (backslash and
 * double quote). The caller adds the surrounding quotes; the finished script is then passed
 * through the osascript single-quote wrapper, which handles the shell layer.
 */
export function asq(value: string): string {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
