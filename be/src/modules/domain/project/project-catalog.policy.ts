import type {
    ConceptDefinition,
    LocalizedText,
    MilestoneDefinition,
    MilestoneLookup,
    ProjectKind,
} from "./project.contracts"
import { PROJECT_COPY } from "./messages/project.messages"

/** The copy of one catalog entry in both locales, read from the message file. */
const copy = (key: string): LocalizedText => ({ vi: PROJECT_COPY.vi[key] ?? key, en: PROJECT_COPY.en[key] ?? key })

/**
 * The concepts of the milestones (decision.projects.model): each is an Essentials lesson id with the evidence it needs. Behaviour
 * concepts need a learner test or e2e flow plus StarCi probes; structure concepts need the AI code read. A concept whose lesson is
 * not written yet is shown as being written by the teacher and is left out of done.
 */
export const PROJECT_CONCEPTS: ReadonlyArray<ConceptDefinition> = [
    {
        id: "request-response-lifecycle",
        label: copy("concept.request-response-lifecycle.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["invalid-input", "request-id"],
    },
    {
        id: "health-probe-semantics",
        label: copy("concept.health-probe-semantics.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["health", "readiness"],
    },
    {
        id: "unit-testing-behavior",
        label: copy("concept.unit-testing-behavior.label"),
        kind: "structure",
        requires: [["test"], ["code-read"]],
        probes: [],
    },
    {
        id: "server-state-cache-lifecycle",
        label: copy("concept.server-state-cache-lifecycle.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["repeat-get"],
    },
    {
        id: "cqrs-read-models",
        label: copy("concept.cqrs-read-models.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "transactions-and-isolation",
        label: copy("concept.transactions-and-isolation.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["parallel-last-item"],
    },
    {
        id: "indexing-and-query-plans",
        label: copy("concept.indexing-and-query-plans.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "authentication-and-authorization",
        label: copy("concept.authentication-and-authorization.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["auth-required"],
    },
    {
        id: "idempotency",
        label: copy("concept.idempotency.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["repeat-same-key"],
    },
    {
        id: "rate-limiting",
        label: copy("concept.rate-limiting.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["burst"],
    },
    {
        id: "structured-logging-and-tracing",
        label: copy("concept.structured-logging-and-tracing.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["request-id"],
    },
    {
        id: "payment-integration",
        label: copy("concept.payment-integration.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["invalid-input"],
    },
    {
        id: "containers-and-images",
        label: copy("concept.containers-and-images.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "linux-processes-and-services",
        label: copy("concept.linux-processes-and-services.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "ci-cd-pipelines",
        label: copy("concept.ci-cd-pipelines.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "infrastructure-as-code",
        label: copy("concept.infrastructure-as-code.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "secrets-management",
        label: copy("concept.secrets-management.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "vpc-routing",
        label: copy("concept.vpc-routing.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "metrics-and-dashboards",
        label: copy("concept.metrics-and-dashboards.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "logs-and-traces",
        label: copy("concept.logs-and-traces.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["request-id"],
    },
    {
        id: "slo-and-alerting",
        label: copy("concept.slo-and-alerting.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "backup-and-failover",
        label: copy("concept.backup-and-failover.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "consistency-and-transactions",
        label: copy("concept.consistency-and-transactions.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["parallel-last-item"],
    },
    {
        id: "partitioning-and-replication",
        label: copy("concept.partitioning-and-replication.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "outbox-and-event-delivery",
        label: copy("concept.outbox-and-event-delivery.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    { id: "saga", label: copy("concept.saga.label"), kind: "structure", requires: [["code-read"]], probes: [] },
    {
        id: "distributed-locks",
        label: copy("concept.distributed-locks.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["probe"]],
        probes: ["parallel-last-item"],
    },
    {
        id: "task-spec",
        label: copy("concept.task-spec.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    { id: "context", label: copy("concept.context.label"), kind: "structure", requires: [["code-read"]], probes: [] },
    {
        id: "tools-permissions",
        label: copy("concept.tools-permissions.label"),
        kind: "behaviour",
        requires: [["probe"], ["code-read"]],
        probes: ["prompt-injection", "permission"],
    },
    {
        id: "verify",
        label: copy("concept.verify.label"),
        kind: "behaviour",
        requires: [["test", "e2e"], ["code-read"]],
        probes: [],
    },
    {
        id: "decompose",
        label: copy("concept.decompose.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "cost-limits",
        label: copy("concept.cost-limits.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
    {
        id: "operate",
        label: copy("concept.operate.label"),
        kind: "behaviour",
        requires: [["probe"]],
        probes: ["failure-path"],
    },
    {
        id: "agent-harness-control-loop",
        label: copy("concept.agent-harness-control-loop.label"),
        kind: "structure",
        requires: [["code-read"]],
        probes: [],
    },
]

/**
 * The milestones of the learning paths (`extensions.conceptMilestones` of the journeys): a project can pursue any of them, and a
 * concept proved in one project counts once for the path.
 */
export const PROJECT_MILESTONES: ReadonlyArray<MilestoneDefinition> = [
    {
        id: "bf-http-foundation",
        title: copy("milestone.bf-http-foundation.title"),
        concepts: ["request-response-lifecycle", "health-probe-semantics", "unit-testing-behavior"],
    },
    {
        id: "bf-data-and-cache",
        title: copy("milestone.bf-data-and-cache.title"),
        concepts: [
            "server-state-cache-lifecycle",
            "cqrs-read-models",
            "transactions-and-isolation",
            "indexing-and-query-plans",
        ],
    },
    {
        id: "bf-safe-and-reliable",
        title: copy("milestone.bf-safe-and-reliable.title"),
        concepts: [
            "authentication-and-authorization",
            "idempotency",
            "rate-limiting",
            "structured-logging-and-tracing",
        ],
    },
    {
        id: "ai-coding-mindset",
        title: copy("milestone.ai-coding-mindset.title"),
        concepts: ["task-spec", "context", "tools-permissions", "verify", "decompose"],
    },
    {
        id: "launch",
        title: copy("milestone.launch.title"),
        concepts: ["authentication-and-authorization", "payment-integration", "idempotency"],
    },
    {
        id: "ops-run-a-service",
        title: copy("milestone.ops-run-a-service.title"),
        concepts: ["health-probe-semantics", "containers-and-images", "linux-processes-and-services"],
    },
    {
        id: "ops-deliver",
        title: copy("milestone.ops-deliver.title"),
        concepts: ["ci-cd-pipelines", "infrastructure-as-code", "secrets-management", "vpc-routing"],
    },
    {
        id: "ops-observe-and-recover",
        title: copy("milestone.ops-observe-and-recover.title"),
        concepts: ["metrics-and-dashboards", "logs-and-traces", "slo-and-alerting", "backup-and-failover"],
    },
    {
        id: "sd-distributed-data",
        title: copy("milestone.sd-distributed-data.title"),
        concepts: ["cqrs-read-models", "consistency-and-transactions", "partitioning-and-replication"],
    },
    {
        id: "sd-reliable-messaging",
        title: copy("milestone.sd-reliable-messaging.title"),
        concepts: ["idempotency", "outbox-and-event-delivery", "saga", "distributed-locks"],
    },
    {
        id: "sd-scale",
        title: copy("milestone.sd-scale.title"),
        concepts: ["server-state-cache-lifecycle", "rate-limiting", "structured-logging-and-tracing"],
    },
    {
        id: "agent-mindset",
        title: copy("milestone.agent-mindset.title"),
        concepts: ["task-spec", "context", "tools-permissions", "verify", "decompose", "cost-limits", "operate"],
    },
    { id: "agent-theory", title: copy("milestone.agent-theory.title"), concepts: ["agent-harness-control-loop"] },
]

/** The milestones an app project lists, and the ones an agent project lists; they are listed in catalog order. */
const MILESTONES_BY_KIND: Readonly<Record<ProjectKind, ReadonlyArray<string>>> = {
    app: [
        "bf-http-foundation",
        "bf-data-and-cache",
        "bf-safe-and-reliable",
        "ai-coding-mindset",
        "launch",
        "ops-run-a-service",
        "ops-deliver",
        "ops-observe-and-recover",
        "sd-distributed-data",
        "sd-reliable-messaging",
        "sd-scale",
    ],
    agent: ["bf-http-foundation", "agent-mindset", "agent-theory", "ai-coding-mindset"],
}

/** The concept of the catalog, or null when the id is not one. */
export const conceptOf = (id: string): ConceptDefinition | null =>
    PROJECT_CONCEPTS.find((concept) => concept.id === id) ?? null

/** The milestone of the catalog, or null when the id is not one. */
export const milestoneOf = (id: string): MilestoneLookup =>
    PROJECT_MILESTONES.find((milestone) => milestone.id === id) ?? null

/** The milestones a project of this kind lists, in catalog order. */
export const milestonesOfKind = (kind: ProjectKind): ReadonlyArray<MilestoneDefinition> =>
    PROJECT_MILESTONES.filter((milestone) => MILESTONES_BY_KIND[kind].includes(milestone.id))
