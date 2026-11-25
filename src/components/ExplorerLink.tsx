"use client";

import Link from "next/link";
import { type ReactNode, useSyncExternalStore } from "react";
import type { ExplorerView } from "./comparisonFilters";
import { recallExplorerSearch, toExplorerHref } from "./explorerMemory";

interface ExplorerLinkProps {
  view: ExplorerView;
  className?: string;
  children: ReactNode;
}

const subscribeToNothing = () => () => {};
const getServerSearch = () => "";

/** A link back to the explorer that keeps the picks and filters left there. */
const ExplorerLink = ({ view, className, children }: ExplorerLinkProps) => {
  const search = useSyncExternalStore(subscribeToNothing, recallExplorerSearch, getServerSearch);

  return (
    <Link href={toExplorerHref(search, view)} className={className}>
      {children}
    </Link>
  );
};

export default ExplorerLink;
