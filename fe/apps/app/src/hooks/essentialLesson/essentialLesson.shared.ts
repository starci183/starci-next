import type {
    ArticleSectionView,
    BugHuntView,
    BugRowState,
    BugRowView,
    PatternPartView,
    ReadingTocRow,
    ReadingView,
} from "@starci-next/ui"
import { chunksOf, ESSENCE_SECTION_ID, isUnder, numberOf } from "@/hooks/lessonParts"
import {
    ESSENTIAL_PARTS,
    type BugResultView,
    type EssentialPart,
    type LessonView,
    type OpenerScoreView,
    type PatternView,
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

/** The Bản chất part: the reading in blocks, the contents with the "read closely" marks and the MCP of the lesson. */
export const readingOf = (
    lesson: LessonView,
    score: OpenerScoreView | undefined,
    endpoint: string,
): ReadingView | undefined => {
    const section = lesson.sections.find((each) => each.id === ESSENCE_SECTION_ID)
    if (section === undefined) return undefined
    const chunks = section.isLocked ? [] : chunksOf(section.markdown, section.title)
    const refs = missedRefsOf(lesson, score)
    const toc: ReadonlyArray<ReadingTocRow> = chunks.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        href: `#${chunk.id}`,
        isFlagged: refs.some((ref) => isUnder(numberOf(chunk.title), ref)),
    }))
    return {
        chunks,
        toc,
        isLocked: section.isLocked,
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

/** A time of day (HH:mm) of an ISO instant in the learner's zone; empty for none. */
const clockOf = (iso: string): string => {
    const date = new Date(iso)
    if (iso === "" || Number.isNaN(date.getTime())) return ""
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
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
        answers: selected.where !== ""
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
