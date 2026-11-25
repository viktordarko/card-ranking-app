import { useSyncExternalStore } from "react";

const subscribeToNothing = () => () => {};

/** The viewer's calendar day as YYYY-MM-DD (a string, so snapshots compare equal). */
const getToday = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const getServerToday = (): string | null => null;

/** Today's date in the browser; null while prerendering, when it isn't known. */
export const useToday = (): string | null =>
  useSyncExternalStore(subscribeToNothing, getToday, getServerToday);
