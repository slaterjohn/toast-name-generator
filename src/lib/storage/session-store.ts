import { readJson, removeKey, writeJson } from "./safe-storage";

/**
 * Generation history for the current tab, so a reload does not start the
 * no-repeat rules from scratch. Cleared when the tab closes.
 */
export const SESSION_KEY = "toast-name-generator:session:v1";

export const loadSessionSnapshot = (): unknown => readJson("session", SESSION_KEY);
export const saveSessionSnapshot = (snapshot: unknown): boolean => writeJson("session", SESSION_KEY, snapshot);
export const clearSessionSnapshot = (): void => removeKey("session", SESSION_KEY);
