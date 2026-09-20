import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Generated components expose `data-ocid` hooks; use them as the test-id
// attribute so semantic queries can fall back to stable selectors.
configure({ testIdAttribute: "data-ocid" });

// Vitest runs without `globals`, so React Testing Library's automatic cleanup
// is not registered. Without this, each render appends to the same document and
// queries match elements from earlier tests.
afterEach(() => {
  cleanup();
});
