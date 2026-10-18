# GitHub Actions security for Z1

Pull requests, including pull requests from forks, are untrusted input. A workflow that checks out and runs their code can execute attacker-controlled build scripts, tests, package install hooks, or other commands.

## Rules for Z1 workflows

- Use `pull_request` for building, testing, linting, or otherwise executing pull request code.
- Keep pull request workflow permissions explicitly read-only. Grant only the individual permissions a job needs.
- Set `persist-credentials: false` on `actions/checkout` when later steps do not need Git authentication.
- Do not expose repository secrets to untrusted pull request code.
- Do not use `pull_request_target` to check out and run a pull request head, merge ref, scripts, or dependencies.
- Treat artifacts produced by pull request workflows as untrusted data. A privileged `workflow_run` workflow may parse validated text from an artifact, but must not execute artifact contents or binaries.
- If a privileged follow-up is required, keep it separate from the build workflow. Validate the originating event, repository, branch, and pull request before acting. Pass only the minimum data needed, and never interpolate untrusted event values directly into shell commands.
- Avoid label-gated privileged builds as a permanent solution. A contributor can update a pull request after approval and before the workflow starts.

## Current Z1 setup

The Android and web/Python CI workflows use `pull_request` and explicitly request only `contents: read`. Their checkout steps do not persist the token in Git configuration. The workflows do not use `pull_request_target` or a privileged `workflow_run` follow-up.

For a workflow that only labels or comments on a pull request and does not need the pull request source, a narrowly permissioned `pull_request_target` workflow can be appropriate. Keep that workflow limited to metadata operations on the base repository; never build or execute the untrusted pull request in that privileged context.

When changing a vulnerable workflow, review already-open pull requests as well. GitHub may evaluate an existing pull request using the workflow version that was present when the pull request was opened. Close or rebase affected requests if needed.
