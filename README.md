# dwoduo

个人站点：[https://dwo.moe](https://dwo.moe)

扎根，发芽，成长。

## Git 推送（避免本地与 GitHub 分叉）

在另一台机器或 GitHub 网页上改过代码后，先同步再推送：

```bash
npm install          # 首次会安装 pre-push 钩子
npm run git:push     # fetch + 必要时 rebase，再 push
```

日常也可用：

- `npm run git:sync` — 仅把 `main` 快进到 `origin/main`
- `git push` — 若落后或分叉，`pre-push` 会拦截并提示先 `git:sync`

若已分叉（本地与远程各有对方没有的提交），不要用 `pull --rebase` 硬并；以 `origin/main` 为准对齐后，再 `cherry-pick` 需要的提交。
