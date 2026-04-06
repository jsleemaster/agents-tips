# Discord AI Company Control Plane Design

## Summary

This design defines a control plane for running one AI "company" per product. In v1 the tenancy model is intentionally strict:

- `1 Discord server = 1 company`
- `1 company = 1 product = 1 repo`
- AI workers may plan, code, open PRs, merge, and deploy to `dev` and `staging`
- `prod` deployment requires Discord approval
- Task intake is mixed: human instructions from Discord and automated intake from GitHub events
- AutoAgent is isolated as an internal `Agent Engineering` team and never handles normal delivery work directly

## Goals

- Create a repeatable control plane that can onboard a new product as a self-contained AI company.
- Keep Discord as the human-facing command and approval surface instead of the source of truth.
- Track every task, run, artifact, merge, and deployment under a single `company_id`.
- Allow autonomous delivery up to merge while keeping production release approval explicit.
- Separate general delivery work from internal agent-improvement work.

## Non-Goals

- Multi-company tenancy inside one Discord server
- Multi-repo ownership for one company
- Full autonomous production deployment without human approval
- Letting AutoAgent take over the general feature-delivery queue
- Rich business analytics, billing, or external customer portals in v1

## Recommended Approach

The recommended approach is a `Paperclip-first control plane` model:

- Discord is the UI layer for commands, alerts, and approvals.
- GitHub is an event source for issues, PR comments, CI failures, and deployment triggers.
- A control plane stores company state, policy, tasks, runs, environments, and artifacts.
- Worker runtimes execute delivery and internal improvement jobs behind the control plane.

This is preferred over a Discord-first or GitHub-first design because the user wants project-level AI companies, not just a bot plus automation scripts.

## System Architecture

The v1 system has four major runtime layers:

1. `Discord Gateway`
   Accepts slash commands, renders task threads, posts alerts, and receives approval actions.
2. `Company API`
   Owns source-of-truth state for companies, teams, policies, tasks, runs, artifacts, and environments.
3. `Execution Orchestrator`
   Assigns jobs, creates worktrees, invokes workers, runs validation, merges code, and triggers deploys.
4. `Artifact Store`
   Persists logs, PR links, commit SHAs, test output, benchmark results, and release records.

The control plane sits in the middle. Discord and GitHub both feed it. Workers never mutate repo or environment state directly without going through policy checks.

## Team Model

Each company starts with a fixed team template:

- `Planning Team`
  Triage, decomposition, routing, priority decisions
- `Delivery Team`
  Code changes, PR creation, merge requests
- `QA Team`
  Verification, release-readiness checks, regression signals
- `Agent Engineering Team`
  AutoAgent benchmark runs and harness improvement work
- `Ops Team`
  Environment status, deployment execution, rollback handling

The team split is intentional. Delivery work and internal agent-improvement work use different queues, policies, and success metrics.

## Data Model

All persisted records are keyed by `company_id`. The core entities are:

- `Company`
  `id`, `name`, `discord_server_id`, `repo_url`, `default_branch`, `policy_id`, `prod_approval_channel_id`
- `Team`
  `id`, `company_id`, `name`, `kind`
- `AgentProfile`
  `id`, `company_id`, `team_id`, `kind`, `toolchain`, `prompt_ref`, `enabled`
- `Task`
  `id`, `company_id`, `source`, `external_ref`, `title`, `description`, `status`, `target_team_id`, `priority`
- `Run`
  `id`, `task_id`, `agent_profile_id`, `status`, `worktree_path`, `branch_name`, `session_ref`, `started_at`, `ended_at`
- `Artifact`
  `id`, `run_id`, `kind`, `uri`, `metadata_json`
- `Environment`
  `id`, `company_id`, `name`, `deploy_strategy`, `approval_required`
- `Policy`
  `id`, `company_id`, `required_checks`, `auto_merge_enabled`, `prod_approval_rule`, `budget_limit`, `max_retries`
- `RepoBinding`
  `id`, `company_id`, `provider`, `repo_owner`, `repo_name`, `installation_ref`, `worktree_root`
- `HeartbeatJob`
  `id`, `company_id`, `kind`, `schedule`, `enabled`, `last_run_at`

## Task Lifecycle

Every work item follows one state machine:

1. `Intake`
   Discord commands, GitHub issues, PR comments, CI failures, or scheduled jobs create a task.
2. `Triage`
   Planning decides urgency, team, and execution mode.
3. `Assignment`
   A concrete agent profile is selected.
4. `Execution`
   A run is created and a worktree plus branch are prepared.
5. `Validation`
   Tests, lint, policy checks, and optional benchmark runs execute.
6. `Review Gate`
   Human review is optional; policy checks are mandatory.
7. `Merge`
   The control plane merges only if all required conditions pass.
8. `Deploy`
   `dev` and `staging` deploy automatically. `prod` requires Discord approval.
9. `Report`
   Results are posted back to Discord and stored as artifacts.
10. `Learn`
   Repeated failures or agent-quality issues are fed into Agent Engineering backlog.

## Discord Structure

Each Discord server uses a fixed channel set:

- `#hq`
  Company status, heartbeat summaries, budget, and release notices
- `#intake`
  Human-created tasks
- `#planning`
  Triage, decomposition, queue management
- `#delivery`
  Execution progress, PRs, merges
- `#qa`
  Test failures, release readiness, regression checks
- `#ops`
  Deployments, rollbacks, incidents
- `#agent-eng`
  AutoAgent benchmarks, harness experiments, tuning work

Each task gets its own Discord thread for status updates, logs, and approval actions.

## Automation and Deployment Policy

The default v1 policy is:

- Tasks may be created from both Discord and GitHub
- AI may code, open PRs, and merge automatically
- Merge is blocked unless required checks pass and no repo lock exists
- `dev` and `staging` deploy automatically after merge
- `prod` deployment requires explicit Discord approval
- Rollback must be callable from Discord by an authorized user

## Failure Handling

The design assumes failure is normal. The control plane must enforce:

- Per-run `time_limit`
- Per-run `budget_limit`
- `max_retries`
- Repo and environment locks
- Explicit failure reasons and resumable run metadata

If a task fails repeatedly, it moves to a `human-attention-needed` state. If AutoAgent fails to improve benchmark score or introduces regression, its run is recorded but cannot affect delivery flow.

## Security and Permissions

Discord users have coarse roles:

- `Owner`
- `Operator`
- `Viewer`

Only `Owner` and `Operator` may approve production deploys, override policy, raise budget ceilings, or trigger rollback. Workers do not receive human-equivalent permissions. They submit requested actions and the control plane enforces policy before execution.

## Success Criteria

The v1 design is successful when:

- Connecting one Discord server creates one company
- One company cleanly owns one repo and one policy boundary
- A task from Discord or GitHub can be traced through task, run, artifact, merge, and deploy records
- Delivery agents can merge automatically when policy permits
- `dev` and `staging` deploy automatically
- `prod` does not deploy without Discord approval
- AutoAgent runs are isolated in `Agent Engineering` queue and produce benchmark artifacts without contaminating delivery work

## Open Assumptions

- The initial implementation will use a single primary repo per company.
- GitHub is the only SCM/event source in v1.
- Discord is the only human-facing interface in v1.
- Production approval is performed through Discord buttons or slash commands backed by control-plane policy checks.
