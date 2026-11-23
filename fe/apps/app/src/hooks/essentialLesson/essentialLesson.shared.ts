import type {
    ArticleSectionView,
    BugHuntView,
    BugRowState,
    BugRowView,
    PatternPartView,
    ReadingChapterView,
    ReadingCheckView,
    ReadingRunView,
    ReadingTermView,
    ReadingVerdictView,
    ReadingView,
} from "@starci-next/ui"
import type { AttemptState } from "@/hooks/lesson"
import {
    chapterPartsOf,
    chunksOf,
    ESSENCE_SECTION_ID,
    isUnder,
    labSplitOf,
    numberOf,
    type EssentialDesk,
} from "@/hooks/lessonParts"
import {
    ESSENTIAL_PARTS,
    type BugResultView,
    type EssentialPart,
    type LessonView,
    type OpenerScoreView,
    type PatternView,
    type ScenarioRunView,
} from "@/modules/types"

export { articleSectionsOf, partPath } from "@/hooks/lessonParts"
export { chunksOf, ESSENCE_SECTION_ID, isUnder, numberOf, readingHrefOf } from "@/hooks/lessonParts"
export type { EssentialDesk } from "@/hooks/lessonParts"

/** The part a `?part=` query names; anything else opens essence. */
export const partOf = (raw: string | undefined): EssentialPart =>
    ESSENTIAL_PARTS.find((each) => each === raw) ?? "essence"

/** The phase each part's own section is stored under (the topic-based format: sections/2-source, 3-scenarios, 4-apply). */
const PART_PHASES: Readonly<Record<Exclude<EssentialPart, "essence">, string>> = {
    source: "explore",
    scenarios: "apply",
    apply: "reflect",
    pattern: "",
}

/** The section a part opens with (its prose, owner style), for a lesson that carries the four parts; undefined otherwise. */
export const partSectionOf = (lesson: LessonView, part: EssentialPart): ArticleSectionView | undefined => {
    if (part === "essence" || lesson.essential === undefined) return undefined
    const phase = PART_PHASES[part]
    if (phase === "") return undefined
    const section = lesson.sections.find((each) => each.phase === phase && each.id !== ESSENCE_SECTION_ID)
    return section === undefined
        ? undefined
        : {
              id: section.id,
              title: section.title,
              markdown: section.markdown,
              isLocked: section.isLocked,
              isFlagged: false,
          }
}

/** The sections the learner should read closely: the `readSection` of every opener question missed on its first pick. */
export const missedRefsOf = (lesson: LessonView, score: OpenerScoreView | undefined): ReadonlyArray<string> => {
    const missed = new Set(
        (score?.questions ?? [])
            .filter((question) => question.attempts > 0 && !question.firstCorrect)
            .map((question) => question.activityId),
    )
    return (lesson.essential?.opener ?? [])
        .filter((question) => missed.has(question.activityId) && question.sectionRef !== "")
        .map((question) => question.sectionRef)
}

/** The client config of the lesson's MCP: `starci-<lesson id>` at `<endpoint>/l/<lesson id>`, the token left to the learner. */
export const mcpConfigOf = (lessonId: string, endpoint: string): string =>
    JSON.stringify(
        {
            mcpServers: {
                [`starci-${lessonId}`]: {
                    type: "http",
                    url: `${endpoint}/l/${lessonId}`,
                    headers: { Authorization: "Bearer YOUR_TOKEN" },
                },
            },
        },
        null,
        2,
    )

/** The Claude Code command of the lesson's MCP. */
export const mcpCommandOf = (lessonId: string, endpoint: string): string =>
    `claude mcp add --transport http starci-${lessonId} ${endpoint}/l/${lessonId} --header "Authorization: Bearer YOUR_TOKEN"`

/** A time of day (HH:mm) of an ISO instant in the learner's zone; empty for none. */
const clockOf = (iso: string): string => {
    const date = new Date(iso)
    if (iso === "" || Number.isNaN(date.getTime())) return ""
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
}

/** The words the learner's runs under the Bản chất flows are built with. */
export type ReadingRunWords = {
    readonly state: Readonly<Record<ReadingRunView["state"], string>>
    /** "07:41 · mọi guard bật" or "07:41 · tắt versioned-set". */
    readonly caption: (time: string, guardsOff: string) => string
    readonly guardsOn: string
}

/** The learner's newest scenario runs (never a challenge run) as the Bản chất flows show them. */
export const readingRunsOf = (
    runs: ReadonlyArray<ScenarioRunView>,
    words: ReadingRunWords,
): ReadonlyArray<ReadingRunView> =>
    runs
        .filter((run) => run.challengeTier === "")
        .map((run) => ({
            scenarioId: run.scenarioId,
            state: run.status,
            stateLabel: words.state[run.status],
            caption: words.caption(
                clockOf(run.at),
                run.guardsOff.length === 0 ? words.guardsOn : run.guardsOff.join(", "),
            ),
            guardsOff: run.guardsOff,
            ledger: run.ledger,
        }))

/** A fenced block of markdown: its words are code, never prose a glossary term is marked in. */
const FENCED = /^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gmu

/** True when the prose of a chapter (its fences and inline code left out) holds the term as a whole word, as the page marks it. */
const usesTerm = (markdown: string, term: string): boolean => {
    if (term.trim() === "") return false
    const prose = markdown.replace(FENCED, "").replace(/`[^`\n]*`/gu, "")
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
    return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "u").test(prose)
}

/** The chapters of the reading: number, time and short title of each, the opener's "read closely" mark, and the terms its prose uses. */
const chaptersOf = (
    markdown: string,
    title: string,
    refs: ReadonlyArray<string>,
    glossary: ReadonlyArray<ReadingTermView>,
): ReadonlyArray<ReadingChapterView> =>
    chunksOf(markdown, title).map((chunk) => {
        const parts = chapterPartsOf(chunk.title)
        return {
            ...chunk,
            at: parts.at,
            label: parts.label,
            isIntro: parts.isIntro,
            isFlagged: refs.some((ref) => isUnder(numberOf(chunk.title), ref)),
            terms: glossary.filter((term) => usesTerm(chunk.markdown, term.term)),
        }
    })

/**
 * The Bản chất part: the reading by chapter with the terms each uses, its lab block, the learner's runs, the "read closely" marks and
 * the MCP of the lesson. The self-checks are drawn from the learner's attempts by {@link readingChecksOf}.
 */
export const readingOf = (
    lesson: LessonView,
    score: OpenerScoreView | undefined,
    endpoint: string,
    runs: ReadonlyArray<ReadingRunView>,
): ReadingView | undefined => {
    const section = lesson.sections.find((each) => each.id === ESSENCE_SECTION_ID)
    if (section === undefined) return undefined
    const glossary = lesson.essential?.reading?.glossary ?? []
    const chapters = section.isLocked
        ? []
        : chaptersOf(section.markdown, section.title, missedRefsOf(lesson, score), glossary)
    return {
        chapters,
        glossary,
        checks: {},
        isLocked: section.isLocked,
        lab: section.isLocked ? "" : labSplitOf(section.markdown).lab,
        runs,
        mcpConfig: endpoint === "" ? "" : mcpConfigOf(lesson.id, endpoint),
        mcpCommand: endpoint === "" ? "" : mcpCommandOf(lesson.id, endpoint),
    }
}

/** The words the Tìm sạn rows are built with. */
export type BugWords = {
    readonly state: Readonly<Record<BugRowState, string>>
    readonly bug: (n: number) => string
    readonly happy: string
    readonly final: string
    readonly hint: (n: number) => string
    readonly openHint: (n: number) => string
    readonly runTitle: (time: string, passed: number, total: number) => string
    readonly noRun: (total: number) => string
}

/** The state a row shows. */
const rowStateOf = (result: BugResultView | undefined): BugRowState => {
    if (result === undefined) return "none"
    return result.isLocked ? "locked" : result.status
}

/**
 * The Tìm sạn part: the commands, every test with the newest run and what it earned, the bugs by essence and whether Challenges is
 * still locked. `opening` is the test whose next hint is being opened.
 */
export const bugHuntOf = (
    lesson: LessonView,
    results: ReadonlyArray<BugResultView>,
    machine: string,
    opening: string,
    words: BugWords,
): BugHuntView | undefined => {
    const tests = lesson.essential?.bugs ?? []
    if (tests.length === 0) return undefined
    let bugIndex = 0
    const rows = tests.map((test): BugRowView => {
        const result = results.find((each) => each.testId === test.id)
        const state = rowStateOf(result)
        if (test.essence !== "") bugIndex += 1
        const caption = test.isFinal ? words.final : test.essence === "" ? words.happy : words.bug(bugIndex)
        const received = result?.received ?? ""
        return {
            id: test.id,
            title: test.title,
            caption,
            state,
            stateLabel: words.state[state],
            expected: state === "failed" ? test.expected : "",
            received: state === "failed" ? received : "",
            measure: test.received,
            pass: result?.pass ?? "",
            fail: result?.fail ?? "",
            hints: (result?.hints ?? []).map((text, index) => ({
                id: `${test.id}-${index + 1}`,
                label: words.hint(index + 1),
                text,
            })),
            nextHint:
                state === "failed" && result !== undefined && result.hintsOpened < result.hintCount
                    ? words.openHint(result.hintsOpened + 1)
                    : "",
            isOpeningHint: opening === test.id,
        }
    })
    const passed = rows.filter((row) => row.state === "passed").length
    const latest = results
        .map((each) => each.at)
        .filter((at) => at !== "")
        .toSorted()
        .at(-1)
    return {
        commands: [
            `starci-next pull ${lesson.id} --bugs`,
            `cd ${lesson.id}-bugs && starci-next up`,
            `starci-next run ${lesson.id} --bugs`,
        ].join("\n"),
        runTitle:
            latest === undefined ? words.noRun(rows.length) : words.runTitle(clockOf(latest), passed, rows.length),
        rows,
        bugs: tests
            .filter((test) => test.essence !== "")
            .map((test) => ({
                id: test.id,
                title: test.title,
                state: rows.find((row) => row.id === test.id)?.state ?? "none",
            })),
        machine,
        isChallengesLocked: passed < rows.length,
        passed,
        total: rows.length,
    }
}

/** The names of the stacks Pattern knows. */
const STACK_NAMES: Readonly<Record<string, string>> = {
    nestjs: "NestJS",
    go: "Go",
    spring: "Spring",
    dotnet: ".NET",
}

/** The words the Pattern part is built with. */
export type PatternWords = {
    readonly soon: (stack: string) => string
    readonly where: string
    readonly howFar: string
    readonly whenDown: string
}

/** The Pattern part: the stack tabs and the stack on screen (the chosen one, else the first ready). */
export const patternOf = (
    patterns: ReadonlyArray<PatternView>,
    chosen: string,
    words: PatternWords,
): PatternPartView | undefined => {
    if (patterns.length === 0) return undefined
    const selected =
        patterns.find((each) => each.stack === chosen) ??
        patterns.find((each) => each.status === "ready") ??
        patterns[0]
    if (selected === undefined) return undefined
    const isReady = selected.status === "ready"
    return {
        stacks: patterns.map((each) => {
            const name = STACK_NAMES[each.stack] ?? each.stack
            return {
                id: each.stack,
                label: each.status === "ready" ? name : words.soon(name),
                isReady: each.status === "ready",
            }
        }),
        selected: selected.stack,
        answers:
            selected.where !== ""
                ? [
                      { id: "where", title: words.where, text: selected.where },
                      { id: "how-far", title: words.howFar, text: selected.howFar },
                      { id: "when-down", title: words.whenDown, text: selected.whenDown },
                  ]
                : [],
        snippet: isReady ? selected.snippet : undefined,
        folder: selected.path,
        files: isReady ? selected.files.map((file, index) => ({ id: `${index}-${file.path}`, ...file })) : [],
        url: selected.url,
        repo: selected.repo,
    }
}

/**
 * The self-checks of the reading as the page draws them, by check id: each wrong pick graded so far with its reason; once solved, the
 * right pick and the reason of every other option the grade released; the option being graded now.
 */
export const readingChecksOf = (
    lesson: LessonView,
    attempts: Readonly<Record<string, AttemptState>>,
    desk: EssentialDesk,
): Readonly<Record<string, ReadingCheckView>> =>
    Object.fromEntries(
        (lesson.essential?.reading?.checks ?? []).map((check): [string, ReadingCheckView] => {
            const attempt = attempts[check.activityId]
            const result = attempt?.view?.result
            const isSolved = result?.correct === true
            const verdicts: Record<string, ReadingVerdictView> = {}
            for (const miss of attempt?.misses ?? [])
                verdicts[miss.optionId] = { state: "wrong", explanation: miss.explanation }
            for (const option of result?.options ?? []) {
                if (option.explanation === "") continue
                if (option.isCorrect && isSolved) verdicts[option.optionId] = { state: "correct", explanation: option.explanation }
                else if (option.selected) verdicts[option.optionId] = { state: "wrong", explanation: option.explanation }
                else if (isSolved && verdicts[option.optionId] === undefined)
                    verdicts[option.optionId] = { state: "reason", explanation: option.explanation }
            }
            const isGrading = attempt !== undefined && (attempt.status === "pending" || attempt.status === "grading")
            return [
                check.id,
                {
                    id: check.id,
                    activityId: check.activityId,
                    prompt: check.prompt,
                    options: check.choices,
                    verdicts,
                    pendingId: isGrading ? (desk.picks[check.activityId] ?? "") : "",
                    isSolved,
                },
            ]
        }),
    )
