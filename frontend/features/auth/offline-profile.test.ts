import { beforeEach, describe, expect, it } from "vitest";
import { readCachedProfile } from "./auth-provider";

const me = { id: "u1", role: "faculty" as const, display_name: "Demo Faculty 1", faculty_id: "f1" };

describe("cached profile for reopening offline", () => {
  beforeEach(() => localStorage.clear());

  it("is returned only for the user of the current session", () => {
    localStorage.setItem("campusos.profile.v1", JSON.stringify(me));
    expect(readCachedProfile("u1")).toEqual(me);
    expect(readCachedProfile("someone-else")).toBeNull();
    expect(readCachedProfile(null)).toBeNull();
  });

  it("is null when nothing is cached or the entry is corrupt", () => {
    expect(readCachedProfile("u1")).toBeNull();
    localStorage.setItem("campusos.profile.v1", "{not json");
    expect(readCachedProfile("u1")).toBeNull();
  });

  it("never contains a token", () => {
    localStorage.setItem("campusos.profile.v1", JSON.stringify(me));
    expect(localStorage.getItem("campusos.profile.v1")).not.toMatch(/token|jwt|bearer/i);
  });
});
