import { LESSON_PHASES } from "./lesson"
import type { StudyView } from "./study"

/** The fake lesson with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const STUDY_PLACEHOLDER: StudyView = {
    id: "placeholder",
    title: "xxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxx",
    category: "xxxxxx",
    topic: { id: "placeholder", title: "xxxxxx", href: "/" },
    difficulty: "foundation",
    difficultyLabel: "xxxxxx",
    facts: "xxxxxxxx",
    isPremium: true,
    phase: "challenge",
    isLocked: false,
    rail: LESSON_PHASES.map((phase) => ({ phase, href: "/", isCurrent: false, isLocked: false })),
    overview: { outcomes: [], prerequisites: [], scope: [], references: [] },
    tabs: [],
    openTabId: "",
    outcomes: [],
    compare: [],
    cards: [{ kind: "reading", id: "placeholder", title: "xxxxxxxxxx", blocks: [] }],
}
