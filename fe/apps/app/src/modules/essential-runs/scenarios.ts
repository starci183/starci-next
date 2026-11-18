import type { ScenarioDetailView, ScenarioHintView, ScenariosPartView, ScenarioState } from "@starci-next/ui"
import type { EssentialScenarioView, EssentialView, LessonView, ScenarioRunView } from "@/modules/types"
import { runOf, scenarioStateOf, type RunDesk, type RunWords } from "./words"

/** The scenario on screen: the one the learner chose, else the first one not green, else the first. */
const selectedScenarioOf = (
    scenarios: ReadonlyArray<EssentialScenarioView>,
    runs: ReadonlyArray<ScenarioRunView>,
    chosen: string,
): EssentialScenarioView | undefined =>
    scenarios.find((each) => each.id === chosen) ??
    scenarios.find((each) => scenarioStateOf(runOf(runs, each.id)) !== "passed") ??
    scenarios[0]

/** What the primary command of the scenarios part does for the state of the scenario on screen. */
export type ScenarioPrimaryKind = "run" | "check" | "next"

/** The primary command for a scenario state: run before the first run, check after a red one, next after a green one. */
export const scenarioPrimaryKindOf = (state: ScenarioState, hasNext: boolean): ScenarioPrimaryKind => {
    if (state === "passed") return hasNext ? "next" : "check"
    return state === "none" || state === "running" ? "run" : "check"
}

/** The command the terminal opens with: run before the first run, check after (the CLI judges the fix again). */
const commandOf = (
    lessonId: string,
    scenario: EssentialScenarioView,
    state: ScenarioState,
    isGuardOff: boolean,
): string => {
    const verb = state === "none" || state === "running" ? "run" : "check"
    const guard = isGuardOff && scenario.guards[0] !== undefined ? ` --guard ${scenario.guards[0]}=off` : ""
    return `starci-next ${verb} ${lessonId} --scenario ${scenario.id}${guard}`
}

/** The hint of a scenario: open once the back end released it, locked while it keeps it back, none when the scenario has none. */
const hintOf = (scenario: EssentialScenarioView, revealed: string | undefined, hasRun: boolean): ScenarioHintView => {
    const text = revealed ?? scenario.hint
    if (text !== "") return { state: "open", text, canReveal: false }
    return { state: scenario.isHintLocked ? "locked" : "none", text: "", canReveal: hasRun }
}

/** What the detail of the scenario on screen is built from. */
type DetailInput = {
    readonly lesson: LessonView
    readonly essential: EssentialView
    readonly scenario: EssentialScenarioView
    readonly run: ScenarioRunView | undefined
    readonly isGuardOff: boolean
    readonly revealed: string | undefined
    readonly words: RunWords
}

/** The scenario on screen: its run, why it is red, the hint, the prompt for the AI and the guard. */
const scenarioDetailOf = (input: DetailInput): ScenarioDetailView => {
    const { scenario, run, words } = input
    const state = scenarioStateOf(run)
    const ruleText = input.essential.invariants.find((each) => each.id === scenario.invariant)?.text ?? ""
    const why = run?.why ?? ""
    const guard = scenario.guards[0]
    return {
        id: scenario.id,
        title: scenario.id,
        fault: scenario.fault,
        state,
        stateLabel: words.scenarioStates[state],
        command: commandOf(input.lesson.id, scenario, state, input.isGuardOff),
        output: [...(run?.output ?? "").split("\n"), ...(run?.ledger ?? "").split("\n")].filter((line) => line !== ""),
        why,
        ruleId: scenario.invariant,
        ruleText,
        hint: hintOf(scenario, input.revealed, run !== undefined),
        fixPrompt: words.fixPrompt({
            lesson: input.lesson.id,
            scenario: scenario.id,
            title: scenario.title,
            why,
            invariant: ruleText === "" ? scenario.invariant : `${scenario.invariant} · ${ruleText}`,
        }),
        guard:
            guard === undefined
                ? undefined
                : { id: guard, flag: `${guard}=off`, ruleId: scenario.invariant, isOff: input.isGuardOff },
    }
}

/** What the scenarios part is built from. */
type ScenariosInput = {
    readonly lesson: LessonView
    readonly essential: EssentialView
    readonly runs: ReadonlyArray<ScenarioRunView>
    readonly desk: RunDesk
    readonly machine: string
    readonly revealed: Readonly<Record<string, string>>
    readonly words: RunWords
}

/** The scenarios part: the list with the state of each newest run, and the scenario on screen. */
export const scenariosOf = (input: ScenariosInput): ScenariosPartView => {
    const { essential, runs, desk, words } = input
    const rows = essential.scenarios.map((scenario) => {
        const state = scenarioStateOf(runOf(runs, scenario.id))
        return {
            id: scenario.id,
            title: scenario.id,
            fault: scenario.title,
            state,
            stateLabel: words.scenarioStates[state],
        }
    })
    const chosen = selectedScenarioOf(essential.scenarios, runs, desk.scenarioId)
    return {
        rows,
        selected:
            chosen === undefined
                ? undefined
                : scenarioDetailOf({
                      lesson: input.lesson,
                      essential,
                      scenario: chosen,
                      run: runOf(runs, chosen.id),
                      isGuardOff: desk.guardsOff[chosen.id] === true,
                      revealed: input.revealed[chosen.id],
                      words,
                  }),
        summary: words.scenariosSummary(rows.filter((row) => row.state === "passed").length, rows.length),
        machine: input.machine,
    }
}
