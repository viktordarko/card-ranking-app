"use client";

import { useSyncExternalStore } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/*
 * The active theme is a browser-only value — an explicit localStorage override if
 * the user picked one, otherwise the OS preference. It lives *outside* React, so
 * it's modelled as a tiny external store and read with `useSyncExternalStore`
 * rather than mirrored into component state through an effect. That keeps it
 * SSR-safe (no hydration mismatch) and, as a bonus, syncs across tabs.
 */
const listeners = new Set<() => void>();

const subscribe = (onStoreChange: () => void): (() => void) => {
  listeners.add(onStoreChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onStoreChange); // follow the OS when unset
  window.addEventListener("storage", onStoreChange); // sync other tabs
  return () => {
    listeners.delete(onStoreChange);
    media.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

const getSnapshot = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    /* localStorage can be unavailable (private mode, disabled storage) */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Unknown on the server; the placeholder icon shows until the client resolves it.
const getServerSnapshot = (): Theme | null => null;

const setTheme = (next: Theme) => {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* persistence is best-effort */
  }
  for (const listener of listeners) {
    listener();
  }
};

const ThemeToggle = () => {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{theme === null ? "◐" : isDark ? "☀" : "☾"}</span>
    </button>
  );
};

export default ThemeToggle;
