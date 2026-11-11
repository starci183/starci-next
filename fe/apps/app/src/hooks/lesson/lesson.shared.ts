import { LESSON_PHASES, type LessonPhase } from "@/modules/types"

/** The phase a route's `phase` query names; anything else opens the overview. */
export const phaseOf = (raw: string | undefined): LessonPhase =>
    LESSON_PHASES.find((phase) => phase === raw) ?? "overview"
