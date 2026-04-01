import { describe, it, expect } from "vitest";
import app from "./index.js";

describe("Express App", () => {
  it("should export the app instance", () => {
    expect(app).toBeDefined();
  });
});
