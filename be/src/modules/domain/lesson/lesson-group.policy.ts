/** The catalog group of each lesson that the teacher's category cannot place; the map of decision.essentials.categories. */
const LESSON_GROUPS: Readonly<Record<string, string>> = {
    "request-response-lifecycle": "backend",
    "server-state-cache-lifecycle": "frontend",
    "cqrs-read-models": "distributed",
    "unit-testing-behavior": "testing",
    "health-probe-semantics": "infra",
    "vpc-routing": "cloud",
    "agent-harness-control-loop": "ai",
}

/** The groups a category maps to when the lesson has no entry; system-design, devops and security have none. */
const CATEGORY_GROUPS: Readonly<Record<string, string>> = {
    backend: "backend",
    frontend: "frontend",
    testing: "testing",
    cloud: "cloud",
    "ai-harness": "ai",
}

/** The group a lesson is listed under: its own entry first, then its category's, and null when neither places it. */
export const groupOf = (lessonId: string, category: string): string | null =>
    LESSON_GROUPS[lessonId] ?? CATEGORY_GROUPS[category] ?? null
