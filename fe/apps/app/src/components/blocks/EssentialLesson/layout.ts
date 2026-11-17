import type { ReactNode } from "react"
import type { EssentialLessonScreen, EssentialLessonView } from "@/hooks/essentialLesson"

/** What a part is drawn from: the lesson as the screen resolved it, the screen's props and actions, and whether the first read still runs. */
export type PartContext = {
    readonly lesson: EssentialLessonView
    readonly screen: EssentialLessonScreen
    readonly isLoading: boolean
}

/**
 * What one part of the lesson page hands the shell: its body, the right column it keeps beside the body on wide screens (undefined
 * leaves the body the whole width) and the one primary command the page header carries for it (undefined draws none).
 */
export type PartLayout = {
    readonly main: ReactNode
    readonly aside: ReactNode | undefined
    readonly action: ReactNode | undefined
}

/** A part builds its layout from the context; the shell never reads a part's data. */
export type PartLayoutOf = (context: PartContext) => PartLayout
