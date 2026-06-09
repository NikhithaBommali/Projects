# Projects

## One-time manual Git branch sync

Use this procedure to create local tracking branches for remote branches that already exist on configured remotes. It is a one-time manual action, not automation.

1. Refresh remote refs before listing anything:

```sh
git fetch --all --prune
```

2. List local branches and remote branches separately:

```sh
git branch

git branch -r
```

Example output:

```text
* main
  feature/local-only

  origin/main
  origin/feature/api
  upstream/release
  upstream/HEAD -> upstream/main
```

The first list shows local branches. The second list shows remote-tracking branches. Symbolic refs such as `upstream/HEAD -> upstream/main` are aliases and must be skipped.

3. Create a local tracking branch for each non-symbolic remote branch from every configured remote when no identically named local branch already exists.

Example commands:

```sh
git switch --track origin/feature/api

git switch --track upstream/release
```

If you prefer `git checkout`, the equivalent is:

```sh
git checkout --track origin/feature/api
```

Only create branches that do not already exist locally. Do not delete, reset, or overwrite any existing local branch.

Conflict and error handling:

- If a local branch already exists, skip it and leave it unchanged.
- If a remote branch name is symbolic or points to `HEAD`, skip it.
- If branch creation fails because the local name is already in use, stop and resolve the naming conflict manually.
- Do not force-update an existing local branch to match a remote branch.

After the branches are created, you can verify the result with:

```sh
git branch -vv
```

This shows local branches and their upstreams. Remote branches remain listed only under `git branch -r`.
