import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { summarizeMetrics } from "../app/lib/analytics.ts";

test("production build and analytics are usable", () => {
  assert.equal(existsSync(new URL("../dist/server/index.js", import.meta.url)), true);
  assert.deepEqual(summarizeMetrics([
    { views: 100, likes: 10, comments: 2, saves: 3, shares: 1, followers: 4 },
    { views: 50, likes: 5, comments: 1, saves: 2, shares: 1, followers: 2 },
  ]), { views: 150, likes: 15, comments: 3, saves: 5, shares: 2, followers: 6, interactions: 25, engagementRate: 1 / 6 });
});
