import type { LessonTopicCatalog, LessonTopicSource } from "./lesson-topic.contracts"

/**
 * The topic level of the catalog (group, topic, lesson): the topic each lesson belongs to, and for each topic its title, the
 * source course modules it comes from and the description, prerequisites and related topics the Topic page shows, as
 * decision.essentials.categories keeps them. The Vietnamese page copy is written as unicode escapes because source stays
 * ASCII; it is the UXUI draft and the teacher may rewrite it.
 */
const LESSON_TOPIC_BY_LESSON: Readonly<Record<string, string>> = {
    "request-response-lifecycle": "backend-framework",
    "server-state-cache-lifecycle": "server-state",
    "cqrs-read-models": "communication-patterns",
    "unit-testing-behavior": "testing-strategy",
    "health-probe-semantics": "kubernetes",
    "vpc-routing": "cloud-networking",
    "agent-harness-control-loop": "llm-agents",
}

/**
 * The V1 content folder each lesson replaces in its topic path, as decision.essentials.categories `topics.map.<lesson>.source`
 * keeps it; the topic page shows the lesson on that row. Health probes replaces the Kubernetes probes row of DevOps module 18:
 * its legacy reference is the TypeScript health endpoint of Fullstack module 16, which is not a row of the Kubernetes path.
 */
const LESSON_SOURCE_BY_LESSON: Readonly<Record<string, string>> = {
    "request-response-lifecycle":
        "courses/0-fullstack-mastery/modules/0-nestjs-core-and-request-lifecycle/contents/1-request-response-lifecycle",
    "server-state-cache-lifecycle":
        "courses/0-fullstack-mastery/modules/4-server-state-with-tanstack-query/contents/0-usequery-and-cache-lifecycle",
    "cqrs-read-models":
        "courses/1-system-design-mastery/modules/3-communication-patterns/contents/6-cqrs-and-read-models",
    "unit-testing-behavior": "courses/0-fullstack-mastery/modules/18-testing-strategy/contents/0-vitest-unit-tests",
    "health-probe-semantics":
        "courses/2-devops-mastery/modules/18-kubernetes-core-and-internals/contents/4-probes-autoscaling-and-rollouts",
    "vpc-routing": "courses/2-devops-mastery/modules/2-aws-foundations/contents/1-vpc-subnet-routing-and-igw",
    "agent-harness-control-loop": "courses/3-ai-llm-mastery/modules/0-llm-and-the-api/contents/1-calling-the-model-api",
}

const LESSON_TOPICS: Readonly<Record<string, LessonTopicSource>> = {
    "backend-framework": {
        title: "Backend framework (NestJS)",
        from: "Fullstack module 0",
        modules: [{ course: "0-fullstack-mastery", index: 0 }],
        details: {
            description:
                "Framework backend t\u1ed5 ch\u1ee9c request th\u1ebf n\u00e0o: c\u00e1c t\u1ea7ng, c\u1ea5u h\u00ecnh, log v\u00e0 c\u00e1ch tr\u1ea3 l\u1ed7i \u0111\u1ec3 h\u1ec7 th\u1ed1ng d\u1ec5 \u0111o\u00e1n khi ch\u1ea1y th\u1eadt.",
            prerequisites: [
                "\u0110\u1ecdc \u0111\u01b0\u1ee3c h\u00e0m TypeScript, Promise v\u00e0 l\u1ed7i throw.",
                "Ph\u00e2n bi\u1ec7t HTTP request, status v\u00e0 handler.",
            ],
            related: ["testing-strategy", "communication-patterns"],
        },
    },
    "server-state": {
        title: "Server state (TanStack Query)",
        from: "Fullstack module 4",
        modules: [{ course: "0-fullstack-mastery", index: 4 }],
        details: {
            description:
                "D\u1eef li\u1ec7u t\u1eeb server tr\u00ean giao di\u1ec7n l\u00e0 m\u1ed9t b\u1ea3n sao c\u00f3 tu\u1ed5i: khi n\u00e0o d\u00f9ng l\u1ea1i, khi n\u00e0o t\u1ea3i l\u1ea1i v\u00e0 c\u00e1ch \u0111\u1ed3ng b\u1ed9 sau khi ghi.",
            prerequisites: [
                "React component, hook v\u00e0 state c\u01a1 b\u1ea3n.",
                "G\u1ecdi HTTP API t\u1eeb tr\u00ecnh duy\u1ec7t.",
            ],
            related: ["backend-framework"],
        },
    },
    "communication-patterns": {
        title: "Communication patterns",
        from: "System Design module 3",
        modules: [{ course: "1-system-design-mastery", index: 3 }],
        details: {
            description:
                "C\u00e1c d\u1ecbch v\u1ee5 n\u00f3i chuy\u1ec7n v\u1edbi nhau th\u1ebf n\u00e0o: \u0111\u1ed3ng b\u1ed9, b\u1ea5t \u0111\u1ed3ng b\u1ed9, s\u1ef1 ki\u1ec7n, saga v\u00e0 t\u00e1ch m\u00f4 h\u00ecnh \u0111\u1ecdc kh\u1ecfi m\u00f4 h\u00ecnh ghi.",
            prerequisites: [
                "M\u1ed9t request \u0111i qua backend th\u1ebf n\u00e0o (topic Backend framework).",
                "Giao d\u1ecbch v\u00e0 index trong database.",
            ],
            related: ["backend-framework", "kubernetes"],
        },
    },
    "testing-strategy": {
        title: "Testing strategy",
        from: "Fullstack module 18",
        modules: [{ course: "0-fullstack-mastery", index: 18 }],
        details: {
            description:
                "Test n\u00e0o b\u1ea3o v\u1ec7 \u0111\u01b0\u1ee3c h\u00e0nh vi: unit, HTTP e2e, UI e2e v\u00e0 mock m\u1ea1ng, m\u1ed7i lo\u1ea1i b\u1eaft \u0111\u01b0\u1ee3c l\u1ed7i g\u00ec.",
            prerequisites: ["Vi\u1ebft \u0111\u01b0\u1ee3c h\u00e0m TypeScript v\u00e0 ch\u1ea1y l\u1ec7nh npm."],
            related: ["backend-framework", "server-state"],
        },
    },
    kubernetes: {
        title: "Kubernetes",
        from: "System Design module 2 v\u00e0 DevOps module 18",
        modules: [
            { course: "1-system-design-mastery", index: 2 },
            { course: "2-devops-mastery", index: 18 },
        ],
        details: {
            description:
                "T\u1eeb pod t\u1edbi control plane: Kubernetes quy\u1ebft \u0111\u1ecbnh ch\u1ea1y, n\u1ed1i m\u1ea1ng, ki\u1ec3m tra s\u1ee9c kho\u1ebb v\u00e0 c\u1eadp nh\u1eadt \u1ee9ng d\u1ee5ng th\u1ebf n\u00e0o.",
            prerequisites: [
                "Container v\u00e0 image.",
                "\u0110\u1ecdc \u0111\u01b0\u1ee3c YAML v\u00e0 l\u1ec7nh shell c\u01a1 b\u1ea3n.",
            ],
            related: ["cloud-networking", "communication-patterns"],
        },
    },
    "cloud-networking": {
        title: "Cloud networking (VPC)",
        from: "DevOps AWS",
        modules: [],
        details: {
            description:
                "M\u1ed9t g\u00f3i tin \u0111i trong cloud th\u1ebf n\u00e0o: VPC, subnet, route table, gateway v\u00e0 ch\u00ednh s\u00e1ch m\u1ea1ng tr\u00ean AWS, GCP, Azure v\u00e0 DigitalOcean.",
            prerequisites: ["\u0110\u1ecba ch\u1ec9 IP, CIDR v\u00e0 c\u1ed5ng."],
            related: ["kubernetes"],
        },
    },
    "llm-agents": {
        title: "LLM & agent",
        from: "Fullstack module 20 v\u00e0 AI/LLM module 0",
        modules: [
            { course: "0-fullstack-mastery", index: 20 },
            { course: "3-ai-llm-mastery", index: 0 },
        ],
        details: {
            description:
                "G\u1ecdi model \u0111\u00fang c\u00e1ch r\u1ed3i b\u1ecdc n\u00f3 trong m\u1ed9t harness: context, c\u00f4ng c\u1ee5, quy\u1ec1n, ng\u00e2n s\u00e1ch v\u00e0 ki\u1ec3m ch\u1ee9ng k\u1ebft qu\u1ea3.",
            prerequisites: ["G\u1ecdi HTTP API v\u00e0 \u0111\u1ecdc JSON."],
            related: ["backend-framework", "testing-strategy"],
        },
    },
}

/** The teacher's catalog: the topic of each lesson and the topics themselves. */
export const DEFAULT_TOPIC_CATALOG: LessonTopicCatalog = {
    byLesson: LESSON_TOPIC_BY_LESSON,
    sources: LESSON_SOURCE_BY_LESSON,
    topics: LESSON_TOPICS,
}
