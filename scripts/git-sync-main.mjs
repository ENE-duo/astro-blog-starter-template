#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function git(...args) {
	return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: "pipe" }).toString().trim();
}

function runGit(...args) {
	execFileSync("git", args, { cwd: root, stdio: "inherit" });
}

function fail(message) {
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
if (branch !== "main") {
	fail(`git:sync 仅用于 main，当前分支：${branch}`);
}

try {
	runGit("fetch", "origin");
} catch {
	fail("fetch origin 失败，请检查网络。");
}

let behind = 0;
let ahead = 0;
try {
	const upstream = git("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
	behind = Number(git("rev-list", "--count", `HEAD..${upstream}`), 10);
	ahead = Number(git("rev-list", "--count", `${upstream}..HEAD`), 10);
} catch {
	runGit("branch", "--set-upstream-to", "origin/main", "main");
	behind = Number(git("rev-list", "--count", "HEAD..origin/main"), 10);
	ahead = Number(git("rev-list", "--count", "origin/main..HEAD"), 10);
}

if (behind === 0) {
	process.stdout.write("已与 origin/main 同步。\n");
	process.exit(0);
}

if (ahead > 0) {
	fail(
		[
			`本地与 origin/main 分叉（超前 ${ahead}、落后 ${behind}）。`,
			"请勿强行 pull --rebase，以免冲突；若远程才是最新：",
			"  git fetch origin && git reset --hard origin/main",
			"再 cherry-pick 你仍需要的本地提交。",
		].join("\n"),
	);
}

process.stdout.write(`正在 rebase：拉取 origin/main 上 ${behind} 个新提交…\n`);
try {
	runGit("pull", "--rebase", "origin", "main");
} catch {
	fail("pull --rebase 失败（可能有冲突）。解决后执行 git rebase --continue，或 git rebase --abort。");
}

process.stdout.write("已与 origin/main 同步。\n");