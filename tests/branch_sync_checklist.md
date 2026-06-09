# Branch Sync Procedure Verification Checklist

Use this checklist to verify the documented manual Git branch sync procedure.

## Remote refresh before branch enumeration
- [ ] Confirm each configured remote was refreshed before any branch enumeration step under the procedure (for example, `git fetch --all --prune` or equivalent per-remote fetch).
- [ ] Confirm verification covers multiple remotes under the PM assumption, not just `origin`.
- [ ] Confirm remote branch enumeration was performed only after the refresh completed.

## Final local branch verification
- [ ] Confirm the final local branch list includes all local branches that existed before the procedure began.
- [ ] Confirm the final local branch list also includes any newly created local tracking branches produced by the procedure.
- [ ] Confirm local branches are verified from the local branch view only, distinct from remote-tracking refs.

## Final remote branch verification
- [ ] Confirm the final remote branch list includes all current remote branches after refresh for every configured remote.
- [ ] Confirm remote branch verification explicitly excludes symbolic refs such as `origin/HEAD -> origin/main` from branch-count and tracking expectations.
- [ ] Confirm remote branches are verified from the remote branch view only, distinct from local branches.

## Remote-to-local tracking branch verification
- [ ] For each non-symbolic remote branch on each remote, confirm there is a corresponding local tracking branch after the procedure.
- [ ] If an identically named local branch already existed before the procedure, confirm that existing local branch satisfied the correspondence requirement and was not duplicated.
- [ ] Confirm tracking verification is performed per remote when multiple remotes are present under the PM assumption.

## Local branch safety verification
- [ ] Confirm no pre-existing local branch was deleted by the procedure.
- [ ] Confirm no pre-existing local branch was reset to a different commit by the procedure.
- [ ] Confirm no pre-existing local branch was overwritten, force-moved, or otherwise replaced by the procedure.
