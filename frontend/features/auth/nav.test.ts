import { describe, expect, it } from "vitest";
import { navFor } from "./nav";

describe("navFor", () => {
  it("hides admin-only destinations from faculty (presentation only)", () => {
    const labels = navFor("faculty", { includeUnbuilt: true }).map((i) => i.label);
    expect(labels).toEqual(["Overview", "Students", "Attendance", "Marks"]);
  });

  it("gives office admin the full set", () => {
    const labels = navFor("office_admin", { includeUnbuilt: true }).map((i) => i.label);
    expect(labels).toEqual(["Overview", "Students", "Academics", "Attendance", "Marks", "Fees", "Student Insights", "Audit"]);
  });

  it("renders only modules that exist", () => {
    expect(navFor("office_admin").map((i) => i.label)).toEqual(["Overview"]);
  });
});
