import type { LastRun, LessonSection } from "./lesson.contracts"

/** What building a fix prompt answered: the text, or why there is none yet. */
export type PromptRead =
    { readonly kind: "prompt"; readonly text: string } | { readonly kind: "none"; readonly line: string }

/** The text between a failure message's invariant tag and its end: the hint, never more. */
const hintOf = (message: string): string => message.replace(/\[invariant:[a-z0-9-]+\]\s*/u, "").trim()

/**
 * The fix prompt for the learner's AI: the scenario, what was observed and, once a run revealed it, the invariant name. It asks
 * for a diagnosis and a fix and gives none: no solution, no hidden test source, only what the learner already saw.
 */
export const fixPromptOf = (lesson: LessonSection, scenarioId: string, last: LastRun | null): PromptRead => {
    const scenario = lesson.scenarios.find((item) => item.id === scenarioId)
    if (scenario === undefined)
        return { kind: "none", line: `Lesson ${lesson.lessonId} has no scenario ${scenarioId}.` }
    if (last === null)
        return {
            kind: "none",
            line: `Run it first: starci-relay run ${lesson.lessonId} --scenario ${scenarioId}. The prompt describes what you observed.`,
        }
    if (last.passed)
        return { kind: "none", line: `Scenario ${scenarioId} passed on its last run; there is nothing to fix.` }
    const failing = last.failing.map(
        (test) => `- ${test.name}${test.message === "" ? "" : `: ${hintOf(test.message)}`}`,
    )
    const invariant = last.invariantIds.map((id) => `${lesson.invariants[id] ?? id} (${id})`)
    const lines = [
        `I am working in the repo of the lesson "${lesson.lessonId}" (TypeScript project in "${lesson.dir}").`,
        `Scenario "${scenario.id}": ${scenario.title}.`,
        ...(scenario.brief === "" ? [] : [`What the scenario does: ${scenario.brief}`]),
        last.guardsOff.length === 0 ? "" : `Guards I turned off for this run: ${last.guardsOff.join(", ")}.`,
        "",
        "What I observed: the scenario fails.",
        ...(failing.length === 0 ? ["- (no failure message in the report)"] : failing),
        ...(invariant.length === 0 ? [] : ["", `The rule that is broken: ${invariant.join("; ")}.`]),
        "",
        "What I need from you:",
        "1. Read the code and explain, in a few sentences, why this scenario fails.",
        "2. Change the production code so the rule holds again.",
        `3. Do not edit the tests, the report or the scenario command, and do not turn guards off to get a pass. I will judge it with: starci-relay check ${lesson.lessonId} --scenario ${scenario.id}`,
    ]
    return { kind: "prompt", text: lines.filter((line, index) => line !== "" || lines[index - 1] !== "").join("\n") }
}
