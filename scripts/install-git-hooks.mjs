#!/usr/bin/env node
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const hooksDir = join(root, ".git", "hooks");

if (!existsSync(join(root, ".git"))) {
	process.exit(0);
}

mkdirSync(hooksDir, { recursive: true });

const prePush = `#!/bin/sh
cd "$(git rev-parse --show-toplevel)" || exit 1
exec node scripts/ensure-sync-before-push.mjs
`;

const hookPath = join(hooksDir, "pre-push");
writeFileSync(hookPath, prePush, { mode: 0o755 });
try {
	chmodSync(hookPath, 0o755);
} catch {
	// Windows may ignore chmod; Git for Windows still runs the hook.
}