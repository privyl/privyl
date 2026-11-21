import { describe, expect, it } from "vitest";
import { VERSION } from "./index.js";

describe("privyl", () => {
  it("loads the core entry point", () => {
    expect(VERSION).toBe("0.0.0");
  });
});
