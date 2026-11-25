import type { Route } from "next";
import type { ExplorerView } from "./comparisonFilters";

const STORAGE_KEY = "explorer-search";

/** Keeps the explorer's last query string for the links that lead back to it. */
export const rememberExplorerSearch = (search: string): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, search);
  } catch {
    /* best-effort: without storage the links just open the default view */
  }
};

export const recallExplorerSearch = (): string => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

/** The explorer's address in `view`, keeping everything else from `search`. */
export const toExplorerHref = (search: string, view: ExplorerView): Route => {
  const params = new URLSearchParams(search);
  params.delete("view");
  const rest = params.toString().replaceAll("%2C", ",").replaceAll("%3A", ":");
  const query = [view === "compare" ? "view=compare" : "", rest].filter(Boolean).join("&");
  return query ? `/?${query}` : "/";
};
