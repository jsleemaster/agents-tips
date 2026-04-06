# Discord AI Company Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a greenfield control plane where one Discord server maps to one AI company, one company maps to one product repo, GitHub and Discord both create tasks, delivery agents can merge automatically, `dev` and `staging` deploy automatically, and `prod` requires Discord approval.

**Architecture:** Use a TypeScript monorepo with a central Fastify control-plane API, a Discord gateway service, a GitHub webhook ingress path, and background workers for delivery and agent-engineering execution. Persist company state in PostgreSQL, route asynchronous work through a database-backed queue, and treat all worker actions as policy-gated requests rather than direct authority.

**Tech Stack:** TypeScript, Node.js 22, pnpm workspaces, Fastify, PostgreSQL, Drizzle ORM, pg-boss, discord.js, Octokit, Vitest, Docker Compose

---

## File Structure

- `package.json`
  Workspace root scripts and shared developer commands
- `pnpm-workspace.yaml`
  Workspace package registration
- `tsconfig.base.json`
  Shared TypeScript config
- `docker-compose.yml`
  Local PostgreSQL bootstrapping
- `apps/control-plane/src/server.ts`
  HTTP API bootstrap
- `apps/control-plane/src/routes/*.ts`
  Company, task, approval, webhook, and deployment routes
- `apps/discord-gateway/src/index.ts`
  Discord bot bootstrap and interaction handlers
- `workers/executor/src/index.ts`
  Delivery queue runner
- `workers/agent-engineering/src/index.ts`
  AutoAgent queue runner
- `packages/core/src/*.ts`
  Shared types, policies, state-machine helpers
- `packages/db/src/*.ts`
  Database client, schema, repositories, migrations
- `packages/policy/src/*.ts`
  Merge and deploy eligibility checks
- `packages/github/src/*.ts`
  GitHub webhook normalization and repo operations
- `packages/discord/src/*.ts`
  Discord message builders and command contracts
- `tests/e2e/*.test.ts`
  End-to-end workflow coverage

### Task 1: Scaffold The Monorepo And Shared Contracts

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `apps/control-plane/package.json`
- Create: `apps/discord-gateway/package.json`
- Create: `workers/executor/package.json`
- Create: `workers/agent-engineering/package.json`
- Create: `packages/core/package.json`
- Create: `packages/core/src/contracts.ts`
- Test: `packages/core/src/contracts.test.ts`

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from "vitest";
import { CompanyStatus, TaskSource, TaskStatus } from "./contracts";

describe("shared contracts", () => {
  it("exports stable enums for tenancy and task lifecycle", () => {
    expect(CompanyStatus.ACTIVE).toBe("active");
    expect(TaskSource.DISCORD).toBe("discord");
    expect(TaskStatus.HUMAN_ATTENTION_NEEDED).toBe("human_attention_needed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/core test`
Expected: FAIL with `Cannot find module './contracts'` or missing workspace config errors

- [ ] **Step 3: Write the minimal workspace and contract implementation**

```json
{
  "name": "discord-ai-company",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm --parallel --filter @company/control-plane --filter @company/discord-gateway --filter @company/executor dev",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

```yaml
packages:
  - "apps/*"
  - "workers/*"
  - "packages/*"
  - "tests"
```

```ts
export const CompanyStatus = {
  ACTIVE: "active",
  PAUSED: "paused",
  ARCHIVED: "archived",
} as const;

export const TaskSource = {
  DISCORD: "discord",
  GITHUB_ISSUE: "github_issue",
  PR_COMMENT: "pr_comment",
  CI_FAILURE: "ci_failure",
  SCHEDULED: "scheduled",
} as const;

export const TaskStatus = {
  INTAKE: "intake",
  TRIAGE: "triage",
  ASSIGNED: "assigned",
  RUNNING: "running",
  VALIDATING: "validating",
  MERGED: "merged",
  DEPLOYING: "deploying",
  DONE: "done",
  FAILED: "failed",
  HUMAN_ATTENTION_NEEDED: "human_attention_needed",
} as const;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/core test`
Expected: PASS with one test suite green

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json apps/control-plane/package.json apps/discord-gateway/package.json workers/executor/package.json workers/agent-engineering/package.json packages/core/package.json packages/core/src/contracts.ts packages/core/src/contracts.test.ts
git commit -m "chore: scaffold control plane workspace"
```

### Task 2: Add Database Schema For Company State

**Files:**
- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/drizzle/0001_initial.sql`
- Create: `packages/db/src/repositories/company-repository.ts`
- Create: `packages/db/src/repositories/task-repository.ts`
- Test: `packages/db/src/schema.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
import { describe, expect, it } from "vitest";
import { tables } from "./schema";

describe("database schema", () => {
  it("defines the control plane tables", () => {
    expect(Object.keys(tables)).toEqual(
      expect.arrayContaining([
        "companies",
        "teams",
        "agentProfiles",
        "tasks",
        "runs",
        "artifacts",
        "environments",
        "policies",
        "repoBindings",
        "heartbeatJobs",
      ]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/db test`
Expected: FAIL because `schema.ts` does not exist

- [ ] **Step 3: Add the schema and repositories**

```ts
export const tables = {
  companies,
  teams,
  agentProfiles,
  tasks,
  runs,
  artifacts,
  environments,
  policies,
  repoBindings,
  heartbeatJobs,
};
```

```sql
create table companies (
  id uuid primary key,
  name text not null,
  discord_server_id text not null unique,
  repo_url text not null,
  default_branch text not null,
  policy_id uuid not null,
  prod_approval_channel_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key,
  company_id uuid not null references companies(id),
  source text not null,
  external_ref text,
  title text not null,
  description text not null,
  status text not null,
  target_team_id uuid,
  priority integer not null default 3,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/db test`
Expected: PASS with schema exports available

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/schema.ts packages/db/src/client.ts packages/db/drizzle/0001_initial.sql packages/db/src/repositories/company-repository.ts packages/db/src/repositories/task-repository.ts packages/db/src/schema.test.ts
git commit -m "feat: add control plane database schema"
```

### Task 3: Implement The Control Plane API

**Files:**
- Create: `apps/control-plane/src/server.ts`
- Create: `apps/control-plane/src/routes/companies.ts`
- Create: `apps/control-plane/src/routes/tasks.ts`
- Create: `apps/control-plane/src/routes/approvals.ts`
- Create: `apps/control-plane/src/routes/health.ts`
- Create: `apps/control-plane/src/plugins/db.ts`
- Test: `apps/control-plane/src/server.test.ts`

- [ ] **Step 1: Write the failing API smoke test**

```ts
import { describe, expect, it } from "vitest";
import { buildServer } from "./server";

describe("control plane server", () => {
  it("registers health and company routes", async () => {
    const app = await buildServer();
    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(JSON.parse(health.body)).toEqual({ ok: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/control-plane test`
Expected: FAIL because `buildServer` is missing

- [ ] **Step 3: Implement the API shell**

```ts
export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(dbPlugin);
  await app.register(healthRoutes);
  await app.register(companyRoutes, { prefix: "/companies" });
  await app.register(taskRoutes, { prefix: "/tasks" });
  await app.register(approvalRoutes, { prefix: "/approvals" });

  return app;
}
```

```ts
export async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/control-plane test`
Expected: PASS with the smoke test green

- [ ] **Step 5: Commit**

```bash
git add apps/control-plane/src/server.ts apps/control-plane/src/routes/companies.ts apps/control-plane/src/routes/tasks.ts apps/control-plane/src/routes/approvals.ts apps/control-plane/src/routes/health.ts apps/control-plane/src/plugins/db.ts apps/control-plane/src/server.test.ts
git commit -m "feat: add control plane api shell"
```

### Task 4: Build Discord Onboarding And Task Intake

**Files:**
- Create: `apps/discord-gateway/src/index.ts`
- Create: `apps/discord-gateway/src/commands/onboard-company.ts`
- Create: `apps/discord-gateway/src/commands/create-task.ts`
- Create: `packages/discord/src/task-thread.ts`
- Create: `packages/discord/src/approval-message.ts`
- Test: `apps/discord-gateway/src/commands/create-task.test.ts`

- [ ] **Step 1: Write the failing Discord intake test**

```ts
import { describe, expect, it } from "vitest";
import { buildCreateTaskPayload } from "./create-task";

describe("create task payload", () => {
  it("maps a Discord request into control plane task input", () => {
    expect(
      buildCreateTaskPayload({
        title: "Fix flaky staging smoke test",
        body: "Triggered manually from Discord",
      }),
    ).toMatchObject({
      source: "discord",
      title: "Fix flaky staging smoke test",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/discord-gateway test`
Expected: FAIL because `buildCreateTaskPayload` is undefined

- [ ] **Step 3: Implement Discord onboarding and task creation**

```ts
export function buildCreateTaskPayload(input: { title: string; body: string }) {
  return {
    source: "discord",
    title: input.title,
    description: input.body,
    status: "intake",
  };
}
```

```ts
export async function handleOnboardCompany(interaction: ChatInputCommandInteraction) {
  await controlPlaneClient.createCompany({
    discordServerId: interaction.guildId,
    name: interaction.guild?.name ?? "Unnamed Company",
    repoUrl: interaction.options.getString("repo", true),
    defaultBranch: interaction.options.getString("default_branch", true),
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/discord-gateway test`
Expected: PASS with task payload mapping covered

- [ ] **Step 5: Commit**

```bash
git add apps/discord-gateway/src/index.ts apps/discord-gateway/src/commands/onboard-company.ts apps/discord-gateway/src/commands/create-task.ts packages/discord/src/task-thread.ts packages/discord/src/approval-message.ts apps/discord-gateway/src/commands/create-task.test.ts
git commit -m "feat: add discord onboarding and intake flow"
```

### Task 5: Ingest GitHub Events Into The Task Queue

**Files:**
- Create: `packages/github/src/webhook-normalizer.ts`
- Create: `apps/control-plane/src/routes/github-webhooks.ts`
- Create: `packages/github/src/repo-client.ts`
- Test: `packages/github/src/webhook-normalizer.test.ts`

- [ ] **Step 1: Write the failing webhook normalization test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeWebhookEvent } from "./webhook-normalizer";

describe("normalizeWebhookEvent", () => {
  it("maps issue events into intake tasks", () => {
    const result = normalizeWebhookEvent({
      event: "issues",
      payload: {
        action: "opened",
        issue: { html_url: "https://github.com/acme/app/issues/12", title: "Broken login" },
      },
    });

    expect(result).toMatchObject({
      source: "github_issue",
      externalRef: "https://github.com/acme/app/issues/12",
      title: "Broken login",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/github test`
Expected: FAIL because the normalizer is missing

- [ ] **Step 3: Implement GitHub normalization and ingress**

```ts
export function normalizeWebhookEvent(input: GitHubWebhookEnvelope) {
  if (input.event === "issues" && input.payload.action === "opened") {
    return {
      source: "github_issue",
      externalRef: input.payload.issue.html_url,
      title: input.payload.issue.title,
      description: input.payload.issue.body ?? "",
      status: "intake",
    };
  }

  return null;
}
```

```ts
app.post("/github/webhooks", async (request, reply) => {
  const normalized = normalizeWebhookEvent(readGitHubEnvelope(request));
  if (normalized) {
    await taskRepository.create(normalized);
  }
  return reply.code(202).send({ accepted: true });
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/github test`
Expected: PASS with issue-event normalization covered

- [ ] **Step 5: Commit**

```bash
git add packages/github/src/webhook-normalizer.ts apps/control-plane/src/routes/github-webhooks.ts packages/github/src/repo-client.ts packages/github/src/webhook-normalizer.test.ts
git commit -m "feat: add github intake pipeline"
```

### Task 6: Implement Policy Checks And Delivery Execution

**Files:**
- Create: `packages/policy/src/merge-policy.ts`
- Create: `packages/policy/src/deploy-policy.ts`
- Create: `workers/executor/src/index.ts`
- Create: `workers/executor/src/run-task.ts`
- Create: `workers/executor/src/worktree.ts`
- Test: `packages/policy/src/merge-policy.test.ts`
- Test: `workers/executor/src/run-task.test.ts`

- [ ] **Step 1: Write the failing merge-policy test**

```ts
import { describe, expect, it } from "vitest";
import { canAutoMerge } from "./merge-policy";

describe("canAutoMerge", () => {
  it("allows merge only when required checks pass", () => {
    expect(
      canAutoMerge({
        autoMergeEnabled: true,
        repoLocked: false,
        requiredChecksPassed: true,
      }),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter @company/policy test`
Expected: FAIL because `canAutoMerge` is missing

- [ ] **Step 3: Implement policy evaluation and executor skeleton**

```ts
export function canAutoMerge(input: {
  autoMergeEnabled: boolean;
  repoLocked: boolean;
  requiredChecksPassed: boolean;
}) {
  return input.autoMergeEnabled && !input.repoLocked && input.requiredChecksPassed;
}
```

```ts
export async function runTask(job: DeliveryJob) {
  const worktree = await createWorktree(job.companyId, job.taskId);
  const result = await coderWorker.execute({
    repoPath: worktree.path,
    prompt: job.prompt,
  });

  if (!canAutoMerge(job.policy)) {
    return { status: "human_attention_needed", result };
  }

  await githubClient.mergePullRequest(job.pullRequestNumber);
  return { status: "merged", result };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/policy test && pnpm --filter @company/executor test`
Expected: PASS with merge gating and executor smoke tests green

- [ ] **Step 5: Commit**

```bash
git add packages/policy/src/merge-policy.ts packages/policy/src/deploy-policy.ts workers/executor/src/index.ts workers/executor/src/run-task.ts workers/executor/src/worktree.ts packages/policy/src/merge-policy.test.ts workers/executor/src/run-task.test.ts
git commit -m "feat: add delivery policy and executor"
```

### Task 7: Add Deployment Flow With Production Approval

**Files:**
- Create: `apps/control-plane/src/routes/deployments.ts`
- Create: `packages/core/src/deployments.ts`
- Create: `packages/discord/src/prod-approval-action.ts`
- Create: `workers/executor/src/deploy.ts`
- Test: `packages/core/src/deployments.test.ts`

- [ ] **Step 1: Write the failing deployment-policy test**

```ts
import { describe, expect, it } from "vitest";
import { getDeploymentDecision } from "./deployments";

describe("getDeploymentDecision", () => {
  it("requires approval for prod but not staging", () => {
    expect(getDeploymentDecision("staging")).toEqual({ autoDeploy: true, approvalRequired: false });
    expect(getDeploymentDecision("prod")).toEqual({ autoDeploy: false, approvalRequired: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/core test`
Expected: FAIL because `deployments.ts` is missing

- [ ] **Step 3: Implement environment-aware deployment rules**

```ts
export function getDeploymentDecision(environment: "dev" | "staging" | "prod") {
  if (environment === "prod") {
    return { autoDeploy: false, approvalRequired: true };
  }

  return { autoDeploy: true, approvalRequired: false };
}
```

```ts
export async function handleProdApproval(action: ProdApprovalAction) {
  await controlPlaneClient.approveDeployment({
    companyId: action.companyId,
    deploymentId: action.deploymentId,
    approvedByDiscordUserId: action.userId,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/core test && pnpm --filter @company/executor test`
Expected: PASS with prod-approval behavior covered

- [ ] **Step 5: Commit**

```bash
git add apps/control-plane/src/routes/deployments.ts packages/core/src/deployments.ts packages/discord/src/prod-approval-action.ts workers/executor/src/deploy.ts packages/core/src/deployments.test.ts
git commit -m "feat: add deployment approval flow"
```

### Task 8: Add Agent Engineering Queue And AutoAgent Adapter

**Files:**
- Create: `workers/agent-engineering/src/index.ts`
- Create: `workers/agent-engineering/src/run-autoagent.ts`
- Create: `workers/agent-engineering/src/benchmark-artifact.ts`
- Create: `packages/core/src/agent-engineering.ts`
- Test: `workers/agent-engineering/src/run-autoagent.test.ts`

- [ ] **Step 1: Write the failing AutoAgent adapter test**

```ts
import { describe, expect, it } from "vitest";
import { buildAutoAgentCommand } from "./run-autoagent";

describe("buildAutoAgentCommand", () => {
  it("keeps agent-engineering work isolated from delivery jobs", () => {
    expect(
      buildAutoAgentCommand({
        repoPath: "/tmp/company-repo",
        benchmarkSuite: "delivery-smoke",
      }),
    ).toContain("autoagent");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/agent-engineering test`
Expected: FAIL because the adapter does not exist

- [ ] **Step 3: Implement the adapter and queue boundary**

```ts
export function buildAutoAgentCommand(input: {
  repoPath: string;
  benchmarkSuite: string;
}) {
  return [
    "python",
    "-m",
    "autoagent",
    "--repo",
    input.repoPath,
    "--benchmark",
    input.benchmarkSuite,
  ].join(" ");
}
```

```ts
export function isAgentEngineeringTask(task: { targetTeam: string }) {
  return task.targetTeam === "agent-engineering";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/agent-engineering test`
Expected: PASS with adapter command generation covered

- [ ] **Step 5: Commit**

```bash
git add workers/agent-engineering/src/index.ts workers/agent-engineering/src/run-autoagent.ts workers/agent-engineering/src/benchmark-artifact.ts packages/core/src/agent-engineering.ts workers/agent-engineering/src/run-autoagent.test.ts
git commit -m "feat: add agent engineering queue"
```

### Task 9: Add Failure Handling, Locks, And Budget Guards

**Files:**
- Create: `packages/core/src/locks.ts`
- Create: `packages/core/src/failures.ts`
- Create: `workers/executor/src/retry-policy.ts`
- Create: `apps/control-plane/src/routes/runs.ts`
- Test: `packages/core/src/failures.test.ts`

- [ ] **Step 1: Write the failing failure-state test**

```ts
import { describe, expect, it } from "vitest";
import { nextFailureState } from "./failures";

describe("nextFailureState", () => {
  it("escalates repeated failures to human attention needed", () => {
    expect(nextFailureState({ attempt: 3, maxRetries: 2 })).toBe("human_attention_needed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @company/core test`
Expected: FAIL because failure escalation helpers are missing

- [ ] **Step 3: Implement retries, locks, and escalation**

```ts
export function nextFailureState(input: { attempt: number; maxRetries: number }) {
  return input.attempt > input.maxRetries ? "human_attention_needed" : "failed";
}
```

```ts
export function acquireRepoLock(input: { companyId: string; repoBindingId: string }) {
  return `${input.companyId}:${input.repoBindingId}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @company/core test && pnpm --filter @company/executor test`
Expected: PASS with failure escalation and retry logic green

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/locks.ts packages/core/src/failures.ts workers/executor/src/retry-policy.ts apps/control-plane/src/routes/runs.ts packages/core/src/failures.test.ts
git commit -m "feat: add failure guards and escalation"
```

### Task 10: Add End-To-End Workflow Coverage And Runbook Docs

**Files:**
- Create: `tests/e2e/company-onboarding.test.ts`
- Create: `tests/e2e/task-to-staging.test.ts`
- Create: `tests/e2e/prod-approval.test.ts`
- Create: `README.md`
- Create: `docs/runbooks/local-development.md`

- [ ] **Step 1: Write the failing end-to-end test**

```ts
import { describe, expect, it } from "vitest";

describe("task to staging flow", () => {
  it("creates a company, ingests a Discord task, merges, and auto-deploys to staging", async () => {
    const result = { status: "not_started" };
    expect(result.status).toBe("staging_deployed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/e2e/task-to-staging.test.ts`
Expected: FAIL because the workflow harness is incomplete

- [ ] **Step 3: Implement the workflow harness and docs**

```md
# Discord AI Company

## Local Development

1. Start PostgreSQL with `docker compose up -d`.
2. Install dependencies with `pnpm install`.
3. Run migrations with `pnpm --filter @company/db migrate`.
4. Start the API, Discord gateway, and executor with `pnpm dev`.
```

```ts
expect(result.task.status).toBe("done");
expect(result.merge.sha).toMatch(/[a-f0-9]{7,40}/);
expect(result.deploy.environment).toBe("staging");
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS with workspace unit tests and e2e workflow coverage green

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/company-onboarding.test.ts tests/e2e/task-to-staging.test.ts tests/e2e/prod-approval.test.ts README.md docs/runbooks/local-development.md
git commit -m "test: add e2e workflow coverage and docs"
```

## Self-Review

- Spec coverage:
  The plan covers company onboarding, Discord intake, GitHub intake, policy-gated execution, auto-merge, environment-aware deploys, Agent Engineering isolation, and failure handling. No approved design area is left without a task.
- Placeholder scan:
  Red-test assertions are intentional, but there are no unresolved "fill this in later" steps left in the plan.
- Type consistency:
  Shared state values are anchored on `TaskStatus`, `TaskSource`, and environment names `dev`, `staging`, `prod`. Agent Engineering remains a separate queue and team throughout the plan.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-06-discord-ai-company-control-plane.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
