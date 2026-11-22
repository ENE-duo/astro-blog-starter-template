#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function git(...args) {
	try {
		return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
	} catch (err) {
		if (err.status === 1 && args[0] === "rev-parse" && args.includes("@{u}")) {
			return "";
		}
		throw err;
	}
}

function countAheadBehind() {
	const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
	if (!upstream) {
		return null;
	}
	const behind = Number(git("rev-list", "--count", `HEAD..${upstream}`), 10);
	const ahead = Number(git("rev-list", "--count", `${upstream}..HEAD`), 10);
	return { upstream, behind, ahead };
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

try {
	git("fetch", "origin", "--quiet");
} catch {
	fail("无法 fetch origin，请检查网络后重试。");
}

const counts = countAheadBehind();
if (!counts) {
	process.exit(0);
}

const { upstream, behind, ahead } = counts;

if (behind === 0) {
	process.exit(0);
}

const hint = "请先运行：npm run git:sync\n然后再：git push（或 npm run git:push）";

if (ahead > 0) {
	fail(
		[
			`本地与 ${upstream} 已分叉（本地多 ${ahead} 个提交，落后 ${behind} 个）。`,
			"直接 push 会被拒，也可能在 rebase 时产生大量冲突。",
			hint,
		].join("\n"),
	);
}

fail([`本地落后 ${upstream} ${behind} 个提交。`, hint].join("\n"));