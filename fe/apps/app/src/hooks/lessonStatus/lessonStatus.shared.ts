import type { LessonStatus, ProgressView } from "@/modules/types"

/** Where the learner stands on a lesson, from the progress the server keeps: nothing sent yet, some attempts, every outcome understood, every outcome proved. */
export const lessonStatusOf = (progress: ProgressView | undefined): LessonStatus => {
    const outcomes = progress?.outcomes ?? []
    if (outcomes.length > 0 && outcomes.every((outcome) => outcome.proved > 0)) return "proved"
    if (outcomes.length > 0 && outcomes.every((outcome) => outcome.understood > 0)) return "understood"
    return (progress?.total ?? 0) > 0 ? "doing" : "none"
}

/** How many of the lessons the learner understood or proved. */
export const understoodOf = (
    lessonIds: ReadonlyArray<string>,
    progress: Readonly<Record<string, ProgressView>>,
): number => lessonIds.filter((id) => ["understood", "proved"].includes(lessonStatusOf(progress[id]))).length
