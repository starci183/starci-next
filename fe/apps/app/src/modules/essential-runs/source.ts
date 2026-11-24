import type { SourcePartView } from "@starci-next/ui"
import { workspaceDownloadOf } from "@/modules/lesson-view"
import type { EssentialView, LessonView, ScenarioRunView } from "@/modules/types"

/** The commands that pull and start the source of a lesson. */
const pullCommandOf = (lessonId: string): string => `starci-relay pull ${lessonId}\ncd ${lessonId}\nstarci-relay up`

/** What the CLI relayed when it failed to start the source: the output of the failed run named up; empty when there is none. */
const upFailureOf = (runs: ReadonlyArray<ScenarioRunView>): ReadonlyArray<string> => {
    const run = runs.find((each) => each.scenarioId === "up" && each.status === "failed")
    return run === undefined ? [] : run.output.split("\n").filter((line) => line !== "")
}

/** The rule of an invariant id in words: its text, or nothing when the lesson does not name it (an id is never shown). */
const ruleWordsOf = (essential: EssentialView, id: string): string =>
    essential.invariants.find((each) => each.id === id)?.text ?? ""

/** The Source part: the machine, the commands, the architecture, the rules in words, the code walk and the files of the archive. */
export const sourceOf = (
    lesson: LessonView,
    essential: EssentialView,
    machine: string,
    runs: ReadonlyArray<ScenarioRunView>,
): SourcePartView => {
    const variant = lesson.workspaces.find((each) => each.id === "typescript") ?? lesson.workspaces[0]
    return {
        machine: { isOnline: machine !== "", name: machine },
        pullCommand: pullCommandOf(lesson.id),
        upFailure: upFailureOf(runs),
        diagram: essential.architecture?.diagram ?? "",
        components: (essential.architecture?.components ?? []).map((component) => ({
            id: component.name,
            name: component.name,
            port: component.port,
            rules: component.invariants
                .map((id) => ruleWordsOf(essential, id))
                .filter((words) => words !== "")
                .join("; "),
        })),
        codeWalk: essential.codeWalk.map((entry) => ({
            id: entry.id,
            title: entry.title,
            rule: ruleWordsOf(essential, entry.invariant),
            location: `${entry.file}:${entry.line}`,
            snippet: entry.snippet,
            why: entry.why,
        })),
        files: (variant?.files ?? []).map((file) => ({ id: file.path, path: file.path })),
        downloadHref: variant?.downloadHref ?? workspaceDownloadOf(lesson.id, "typescript") ?? "",
    }
}
