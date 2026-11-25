import "react";

declare module "react" {
  /** Custom properties set from JSX; a typo in one is a type error. */
  interface CSSProperties {
    "--card-count"?: number;
  }
}
