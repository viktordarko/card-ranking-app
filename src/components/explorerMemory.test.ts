import { describe, expect, it } from "vitest";
import { toExplorerHref } from "./explorerMemory";

describe("toExplorerHref", () => {
  it("switches the view and keeps the picks and filters", () => {
    const search = "view=compare&cards=rogers-world-elite,td-aeroplan-vi&noFx=1";
    expect(toExplorerHref(search, "browse")).toBe("/?cards=rogers-world-elite,td-aeroplan-vi&noFx=1");
    expect(toExplorerHref(search, "compare")).toBe(`/?${search}`);
  });

  it("is the plain address when there is nothing to keep", () => {
    expect(toExplorerHref("", "browse")).toBe("/");
    expect(toExplorerHref("", "compare")).toBe("/?view=compare");
  });
});
