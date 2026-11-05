import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// Slow shared dev machines: give async queries more time before failing (does not slow passing tests).
configure({ asyncUtilTimeout: 5000 });
