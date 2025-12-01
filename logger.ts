export const log = (...args: unknown[]) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}]`, ...args);
};
export const warn = (...args: unknown[]) => {
  const ts = new Date().toISOString();
  console.warn(`[${ts}]`, ...args);
};
export const error = (...args: unknown[]) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}]`, ...args);
};
