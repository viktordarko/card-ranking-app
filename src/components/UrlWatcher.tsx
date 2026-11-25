import { useSearchParams } from "next/navigation";
import { useLayoutEffect } from "react";

interface UrlWatcherProps {
  onChange: () => void;
}

/**
 * Calls `onChange` on mount and whenever the query string changes, by any route:
 * Back, a link, or our own `history.replaceState`. It renders nothing and lives
 * apart from the explorer because `useSearchParams` opts its nearest Suspense
 * boundary out of prerendering, and the card list should stay in the static HTML.
 * A layout effect, so the restored view is what paints first after a navigation.
 */
const UrlWatcher = ({ onChange }: UrlWatcherProps) => {
  const search = useSearchParams().toString();

  useLayoutEffect(() => {
    onChange();
    // `search` is only the trigger. `onChange` reads the live address, because
    // this value can lag behind our own `replaceState` and would undo a click.
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [search, onChange]);

  return null;
};

export default UrlWatcher;
