import type {
    ApplyPartView,
    ArticleSectionView,
    CompareRowView,
    OpenerView,
    QuestionCardView,
    QuestionLink,
    ScenarioCardView,
    ScenariosPartView,
    SourcePartView,
} from "@starci-next/ui"
import type { AttemptState } from "@/hooks/lesson"
import { topicPath } from "@/modules/routes"
import {
    CHALLENGE_LEVELS,
    ESSENTIAL_PARTS,
    type ChallengeLevel,
    type EssentialPart,
    type EssentialQuestionView,
    type EssentialView,
    type LessonView,
    type OpenerScoreView,
    type ScenarioRunView,
} from "@/modules/types"

/** The part a `?part=` query names; anything else opens Bản chất. */
export const partOf = (raw: string | undefined): EssentialPart =>
    ESSENTIAL_PARTS.find((each) => each === raw) ?? "essence"

/** The address of a part of a lesson, with an optional anchor or scenario. */
export const partPath = (lesson: LessonView, part: EssentialPart, extra = ""): string =>
    `${topicPath(lesson.topic.id)}/${encodeURIComponent(lesson.id)}?part=${part}${extra}`

/** The words the builders need, resolved by the hook. */
export type EssentialWords = {
    readonly position: (n: number, total: number) => string
    readonly score: (right: number, total: number) => string
    readonly readSection: (n: number, title: string) => string
    readonly seeScenario: (title: string) => string
    readonly scenarioStates: Readonly<Record<ScenarioCardView["state"], string>>
    readonly scenariosSummary: (green: number, total: number) => string
    readonly ranAt: (at: string) => string
    readonly fixPrompt: (input: {
        readonly lesson: string
        readonly scenario: string
        readonly title: string
        readonly why: string
        readonly invariant: string
    }) => string
    readonly levels: Readonly<Record<ChallengeLevel, string>>
    readonly points: (points: number) => string
    readonly hiddenState: (green: number, total: number) => string
    readonly notRun: string
    readonly rungStates: { readonly locked: string; readonly open: string; readonly green: string }
}

/** What the learner holds in this visit: the pick of each question, the retake marks and the selections. */
export type EssentialDesk = {
    readonly picks: Readonly<Record<string, string>>
    /** The revision of each question when the retake started; an attempt at or under it counts as not answered again. */
    readonly retakeFrom: Readonly<Record<string, number>>
    readonly openerIndex: number | undefined
    readonly scenarioId: string
    readonly challengeId: string
}

/** One question as the card draws it, from its attempt; a retake hides the attempts made before it. */
const questionCardOf = (
    question: EssentialQuestionView,
    attempt: AttemptState | undefined,
    desk: EssentialDesk,
    links: ReadonlyArray<QuestionLink>,
): QuestionCardView => {
    const base = desk.retakeFrom[question.activityId]
    const isHidden = attempt === undefined || (base !== undefined && attempt.revision <= base)
    const view = isHidden ? undefined : attempt.view
    const result = view?.result
    const picked = desk.picks[question.activityId] ?? view?.answer.optionId ?? ""
    return {
        id: question.activityId,
        prompt: question.prompt,
        choices: question.choices,
        pickedId: picked,
        status: isHidden ? "idle" : attempt.status,
        isSendFailed: !isHidden && attempt.isSendFailed,
        isCorrect: result?.correct === true,
        explanation: result?.options.find((option) => option.selected)?.explanation ?? "",
        links,
    }
}

/** Where a wrong answer sends the learner: the section to read closely and the scenario that shows it. */
const linksOf = (lesson: LessonView, question: EssentialQuestionView, words: EssentialWords): Array<QuestionLink> => {
    const sections = articleSectionsOf(lesson)
    const index = sections.findIndex((section) => section.id === question.sectionId)
    const section = sections[index]
    const scenario = lesson.essential?.scenarios.find((each) => each.id === question.scenarioId)
    return [
        ...(section === undefined
            ? []
            : [
                  {
                      id: `section-${section.id}`,
                      label: words.readSection(index + 1, section.title),
                      href: partPath(lesson, "essence", `#section-${section.id}`),
                  },
              ]),
        ...(scenario === undefined
            ? []
            : [
                  {
                      id: `scenario-${scenario.id}`,
                      label: words.seeScenario(scenario.title),
                      href: partPath(lesson, "scenarios", `&scenario=${encodeURIComponent(scenario.id)}`),
                  },
              ]),
    ]
}

/** The sections the article draws: the theory ones, or every section of a lesson without theory. */
export const articleSectionsOf = (lesson: LessonView): LessonView["sections"] => {
    const theory = lesson.sections.filter((section) => section.phase === "explain")
    return theory.length > 0 ? theory : lesson.sections
}

/** The opener on screen: the five cards, the one shown (the first not answered, unless the learner moved), its position and the score. */
export const openerOf = (
    lesson: LessonView,
    essential: EssentialView,
    attempts: Readonly<Record<string, AttemptState>>,
    desk: EssentialDesk,
    words: EssentialWords,
): OpenerView => {
    const questions = essential.opener.map((question) =>
        questionCardOf(question, attempts[question.activityId], desk, linksOf(lesson, question, words)),
    )
    const firstOpen = questions.findIndex((question) => question.status !== "graded")
    const index = Math.min(desk.openerIndex ?? (firstOpen === -1 ? 0 : firstOpen), Math.max(questions.length - 1, 0))
    const isDone = questions.length > 0 && questions.every((question) => question.status === "graded")
    return {
        questions,
        index,
        position: words.position(index + 1, questions.length),
        score: isDone ? words.score(questions.filter((question) => question.isCorrect).length, questions.length) : "",
        isRetake: Object.keys(desk.retakeFrom).length > 0,
    }
}

/** The article, each section flagged "nên đọc kỹ" when an opener question that links to it was first (or is now) answered wrong. */
export const articleOf = (
    lesson: LessonView,
    opener: OpenerView,
    score: OpenerScoreView | undefined,
): ReadonlyArray<ArticleSectionView> => {
    const wrong = new Set(
        (lesson.essential?.opener ?? [])
            .filter((question) => {
                const first = score?.questions.find((each) => each.activityId === question.activityId)
                const card = opener.questions.find((each) => each.id === question.activityId)
                return first?.firstCorrect === false || (card?.status === "graded" && !card.isCorrect)
            })
            .map((question) => question.sectionId),
    )
    return articleSectionsOf(lesson).map((section) => ({
        id: section.id,
        title: section.title,
        markdown: section.markdown,
        isLocked: section.isLocked,
        isFlagged: wrong.has(section.id),
    }))
}

/** The before and after of each opener question, from the first and the newest graded answers. */
export const compareOf = (
    essential: EssentialView,
    score: OpenerScoreView | undefined,
): ReadonlyArray<CompareRowView> =>
    essential.opener.map((question) => {
        const row = score?.questions.find((each) => each.activityId === question.activityId)
        const sideOf = (isRight: boolean | undefined): CompareRowView["before"] => {
            if (isRight === undefined) return "none"
            return isRight ? "right" : "wrong"
        }
        return {
            id: question.activityId,
            prompt: question.prompt,
            before: sideOf(row?.firstCorrect),
            after: sideOf(row === undefined ? undefined : row.attempts > 1 ? row.latestCorrect : undefined),
        }
    })

/** The source part: the pull and up commands, the architecture with the rules in words and the code walk. */
export const sourceOf = (lesson: LessonView, essential: EssentialView): SourcePartView => {
    const ruleOf = (id: string): string => {
        const text = essential.invariants.find((each) => each.id === id)?.text
        return text === undefined ? id : `${id} · ${text}`
    }
    return {
        pullCommand: `npx @starci/next pull ${lesson.id}\ncd ${lesson.id}\nstarci-next up`,
        diagram: essential.architecture?.diagram ?? "",
        components: (essential.architecture?.components ?? []).map((component) => ({
            id: component.name,
            name: component.name,
            port: component.port,
            rules: component.invariants.map((id) => ruleOf(id)).join("; "),
        })),
        codeWalk: essential.codeWalk.map((entry) => ({
            id: entry.id,
            title: entry.title,
            invariant: ruleOf(entry.invariant),
            location: `${entry.file}:${entry.line}`,
            snippet: entry.snippet,
            why: entry.why,
        })),
    }
}

/** The state of a scenario from its newest run: a red run with a guard off is the fault landing, not a failure. */
const scenarioStateOf = (run: ScenarioRunView | undefined): ScenarioCardView["state"] => {
    if (run === undefined) return "none"
    if (run.status === "running") return "running"
    if (run.status === "passed") return "passed"
    return run.guardsOff.length > 0 ? "guarded" : "failed"
}

/** The Kịch bản part: each scenario with its newest relayed run, its commands and, when red, why and the prompt for the AI. */
export const scenariosOf = (
    lesson: LessonView,
    essential: EssentialView,
    runs: ReadonlyArray<ScenarioRunView>,
    desk: EssentialDesk,
    words: EssentialWords,
): ScenariosPartView => {
    const scenarios = essential.scenarios.map((scenario): ScenarioCardView => {
        const run = runs.find((each) => each.scenarioId === scenario.id && each.challengeTier === "")
        const state = scenarioStateOf(run)
        const invariant = essential.invariants.find((each) => each.id === scenario.invariant)
        const invariantWords = invariant === undefined ? scenario.invariant : `${invariant.id} · ${invariant.text}`
        const run1 = `starci-next run ${lesson.id} --scenario ${scenario.id}`
        return {
            id: scenario.id,
            title: scenario.title,
            fault: scenario.fault,
            state,
            stateLabel: words.scenarioStates[state],
            runCommand: run1,
            guardCommands: scenario.guards.map((guard) => `${run1} --guard ${guard}=off`),
            checkCommand: `starci-next check ${lesson.id} --scenario ${scenario.id}`,
            expected: scenario.expected,
            output: [...(run?.output ?? "").split("\n"), ...(run?.ledger ?? "").split("\n")].filter(
                (line) => line !== "",
            ),
            why: run?.why ?? "",
            invariant: invariantWords,
            hint: scenario.hint,
            fixPrompt: words.fixPrompt({
                lesson: lesson.id,
                scenario: scenario.id,
                title: scenario.title,
                why: run?.why ?? "",
                invariant: invariantWords,
            }),
            at: run === undefined ? "" : words.ranAt(run.at),
        }
    })
    return {
        scenarios,
        selectedId: desk.scenarioId === "" ? (scenarios[0]?.id ?? "") : desk.scenarioId,
        summary: words.scenariosSummary(
            scenarios.filter((scenario) => scenario.state === "passed").length,
            scenarios.length,
        ),
    }
}

/** How many hidden scenarios of a tier the newest runs turned green with no guard off. */
const greenOf = (runs: ReadonlyArray<ScenarioRunView>, level: string): number =>
    runs.filter((run) => run.challengeTier === level && run.status === "passed" && run.guardsOff.length === 0).length

/** The Tự áp dụng part: the four rungs (a rung opens once the one below is all green) and the rung on screen. */
export const applyOf = (
    lesson: LessonView,
    essential: EssentialView,
    runs: ReadonlyArray<ScenarioRunView>,
    attempts: Readonly<Record<string, AttemptState>>,
    desk: EssentialDesk,
    words: EssentialWords,
): ApplyPartView => {
    const ordered = CHALLENGE_LEVELS.flatMap((level) => essential.challenges.filter((each) => each.level === level))
    const isOpen = (index: number): boolean => {
        const below = ordered[index - 1]
        return below === undefined || (below.hiddenScenarios > 0 && greenOf(runs, below.level) >= below.hiddenScenarios)
    }
    const rungs = ordered.map((challenge, index) => {
        const green = greenOf(runs, challenge.level)
        const isGreen = challenge.hiddenScenarios > 0 && green >= challenge.hiddenScenarios
        return {
            id: challenge.id,
            level: words.levels[challenge.level],
            title: challenge.title,
            state: isOpen(index) ? (isGreen ? words.rungStates.green : words.rungStates.open) : words.rungStates.locked,
        }
    })
    const chosen = ordered.findIndex((each) => each.id === desk.challengeId)
    const highestOpen = ordered.reduce((last, _each, index) => (isOpen(index) ? index : last), 0)
    const selectedIndex = chosen >= 0 ? chosen : highestOpen
    const selected = ordered[selectedIndex]
    const green = selected === undefined ? 0 : greenOf(runs, selected.level)
    const hasRun = selected !== undefined && runs.some((run) => run.challengeTier === selected.level)
    return {
        rungs,
        selectedId: selected?.id ?? "",
        challenge:
            selected === undefined
                ? undefined
                : {
                      id: selected.id,
                      heading: `${words.levels[selected.level]} · ${selected.title}`,
                      brief: selected.brief,
                      rubric: selected.rubric.map((criterion) => ({
                          id: criterion.id,
                          criterion: criterion.criterion,
                          points: words.points(criterion.points),
                          isCritical: criterion.isCritical,
                      })),
                      questions: selected.questions.map((question) =>
                          questionCardOf(question, attempts[question.activityId], desk, []),
                      ),
                      runCommand: `starci-next run ${lesson.id} --challenge ${selected.level}`,
                      hiddenState: hasRun ? words.hiddenState(green, selected.hiddenScenarios) : words.notRun,
                      isLocked: !isOpen(selectedIndex),
                  },
    }
}
