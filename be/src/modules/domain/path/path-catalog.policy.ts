import type { PathCheckDefinition, PathDefinition, PathText } from "./path.contracts"
import type { MessageBundle } from "@modules/platform/i18n"
import { PATH_COPY } from "./messages/path.messages"

/** The text of a key in both locales, read from `messages`; a key it does not have shows as itself, so a gap is visible and never blank. */
export const textFrom = (messages: MessageBundle, key: string): PathText => ({
    vi: messages.vi[key] ?? key,
    en: messages.en[key] ?? key,
})

const copy = (key: string): PathText => textFrom(PATH_COPY, key)

const verified = (key: string): PathCheckDefinition => ({ text: copy(key), selfReported: false })

const reported = (key: string): PathCheckDefinition => ({ text: copy(key), selfReported: true })

/**
 * The five outcome paths (decision.learning-program.outcome-layer and the journeys of the program records). A path strings the
 * parts into a concrete done; the parts stay usable alone. A step whose lesson the teacher is still writing is still listed,
 * because the learner needs the whole road. The words live in the message file, under the keys named here.
 */
export const PATH_DEFINITIONS: ReadonlyArray<PathDefinition> = [
    {
        id: "founder",
        kind: "build",
        title: copy("founder.title"),
        pitch: copy("founder.pitch"),
        done: copy("founder.done"),
        checks: [
            verified("founder.check.1"),
            verified("founder.check.2"),
            verified("founder.check.3"),
            reported("founder.check.4"),
        ],
        weeks: 16,
        steps: [
            {
                id: "understand-http",
                stage: "understand",
                part: "essentials",
                title: copy("founder.step.understand-http"),
            },
            {
                id: "understand-launch",
                stage: "understand",
                part: "essentials",
                title: copy("founder.step.understand-launch"),
            },
            { id: "build-with-agent", stage: "build", part: "projects", title: copy("founder.step.build-with-agent") },
            { id: "build-product", stage: "build-ai", part: "projects", title: copy("founder.step.build-product") },
            { id: "build-launch", stage: "build-ai", part: "projects", title: copy("founder.step.build-launch") },
            {
                id: "interview-pitch",
                stage: "interview",
                part: "interview",
                title: copy("founder.step.interview-pitch"),
            },
            { id: "prove-profile", stage: "prove", part: "profile", title: copy("founder.step.prove-profile") },
        ],
    },
    {
        id: "ai-engineer",
        kind: "agent",
        title: copy("ai-engineer.title"),
        pitch: copy("ai-engineer.pitch"),
        done: copy("ai-engineer.done"),
        checks: [
            verified("ai-engineer.check.1"),
            verified("ai-engineer.check.2"),
            verified("ai-engineer.check.3"),
            verified("ai-engineer.check.4"),
            reported("ai-engineer.check.5"),
        ],
        weeks: 18,
        steps: [
            {
                id: "understand-loop",
                stage: "understand",
                part: "essentials",
                title: copy("ai-engineer.step.understand-loop"),
            },
            {
                id: "understand-http",
                stage: "understand",
                part: "essentials",
                title: copy("ai-engineer.step.understand-http"),
            },
            { id: "remember-ai", stage: "remember", part: "review", title: copy("ai-engineer.step.remember-ai") },
            { id: "build-labs", stage: "build", part: "projects", title: copy("ai-engineer.step.build-labs") },
            { id: "build-agent", stage: "build-ai", part: "projects", title: copy("ai-engineer.step.build-agent") },
            { id: "build-deploy", stage: "build-ai", part: "projects", title: copy("ai-engineer.step.build-deploy") },
            { id: "interview-ai", stage: "interview", part: "interview", title: copy("ai-engineer.step.interview-ai") },
            { id: "prove-profile", stage: "prove", part: "profile", title: copy("ai-engineer.step.prove-profile") },
        ],
    },
    {
        id: "backend-fullstack",
        kind: "job",
        title: copy("backend-fullstack.title"),
        pitch: copy("backend-fullstack.pitch"),
        done: copy("backend-fullstack.done"),
        checks: [
            verified("backend-fullstack.check.1"),
            verified("backend-fullstack.check.2"),
            verified("backend-fullstack.check.3"),
            reported("backend-fullstack.check.4"),
        ],
        weeks: 20,
        steps: [
            {
                id: "understand-backend",
                stage: "understand",
                part: "essentials",
                title: copy("backend-fullstack.step.understand-backend"),
            },
            {
                id: "remember-decks",
                stage: "remember",
                part: "review",
                title: copy("backend-fullstack.step.remember-decks"),
            },
            {
                id: "solve-patterns",
                stage: "solve",
                part: "practice",
                title: copy("backend-fullstack.step.solve-patterns"),
            },
            { id: "build-apps", stage: "build", part: "projects", title: copy("backend-fullstack.step.build-apps") },
            { id: "build-ai", stage: "build-ai", part: "projects", title: copy("backend-fullstack.step.build-ai") },
            {
                id: "interview-fullstack",
                stage: "interview",
                part: "interview",
                title: copy("backend-fullstack.step.interview-fullstack"),
            },
            {
                id: "prove-profile",
                stage: "prove",
                part: "profile",
                title: copy("backend-fullstack.step.prove-profile"),
            },
        ],
    },
    {
        id: "devops-sre",
        kind: "job",
        title: copy("devops-sre.title"),
        pitch: copy("devops-sre.pitch"),
        done: copy("devops-sre.done"),
        checks: [
            verified("devops-sre.check.1"),
            verified("devops-sre.check.2"),
            verified("devops-sre.check.3"),
            reported("devops-sre.check.4"),
        ],
        weeks: 18,
        steps: [
            {
                id: "understand-infra",
                stage: "understand",
                part: "essentials",
                title: copy("devops-sre.step.understand-infra"),
            },
            { id: "remember-decks", stage: "remember", part: "review", title: copy("devops-sre.step.remember-decks") },
            {
                id: "build-containerise",
                stage: "build",
                part: "projects",
                title: copy("devops-sre.step.build-containerise"),
            },
            { id: "build-ai", stage: "build-ai", part: "projects", title: copy("devops-sre.step.build-ai") },
            {
                id: "interview-devops",
                stage: "interview",
                part: "interview",
                title: copy("devops-sre.step.interview-devops"),
            },
            { id: "prove-profile", stage: "prove", part: "profile", title: copy("devops-sre.step.prove-profile") },
        ],
    },
    {
        id: "system-design-senior",
        kind: "job",
        title: copy("system-design-senior.title"),
        pitch: copy("system-design-senior.pitch"),
        done: copy("system-design-senior.done"),
        checks: [
            verified("system-design-senior.check.1"),
            verified("system-design-senior.check.2"),
            verified("system-design-senior.check.3"),
            reported("system-design-senior.check.4"),
        ],
        weeks: 14,
        steps: [
            {
                id: "understand-distributed",
                stage: "understand",
                part: "essentials",
                title: copy("system-design-senior.step.understand-distributed"),
            },
            {
                id: "remember-decks",
                stage: "remember",
                part: "review",
                title: copy("system-design-senior.step.remember-decks"),
            },
            {
                id: "build-services",
                stage: "build",
                part: "projects",
                title: copy("system-design-senior.step.build-services"),
            },
            { id: "build-ai", stage: "build-ai", part: "projects", title: copy("system-design-senior.step.build-ai") },
            {
                id: "interview-senior",
                stage: "interview",
                part: "interview",
                title: copy("system-design-senior.step.interview-senior"),
            },
            {
                id: "prove-profile",
                stage: "prove",
                part: "profile",
                title: copy("system-design-senior.step.prove-profile"),
            },
        ],
    },
]

/** The definition of a path, or null for an id the catalog does not have. */
export const definitionOf = (pathId: string): PathDefinition | null =>
    PATH_DEFINITIONS.find((definition) => definition.id === pathId) ?? null
