"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import type {
    BugHuntLabels,
    BugHuntView,
    PatternLabels,
    PatternPartView,
    ReadingLabels,
    ReadingView,
} from "@starci-next/ui"
import { useSession } from "@/hooks/auth"
import { useLessonJourneyLabels } from "@/hooks/lessonStudy"
import { useMutateOpenLessonBugHintSwr, useQueryLessonBugResultsSwr, useQueryMcpTokensSwr } from "@/hooks/swr"
import type { BugResultView, EssentialPart, LessonView, OpenerScoreView, ScenarioRunView } from "@/modules/types"
import {
    bugHuntOf,
    patternOf,
    readingOf,
    readingRunsOf,
    type BugWords,
    type PatternWords,
    type ReadingRunWords,
} from "./essentialLesson.shared"

/** The words of Bản chất, Tìm sạn and Pattern, and the title of the parts block every right column ends with. */
export type FivePartsLabels = {
    readonly reading: ReadingLabels
    readonly bugs: BugHuntLabels
    readonly pattern: PatternLabels
    readonly journeyTitle: string
    /** The line before a written explanation can be sent: the question comes first. */
    readonly writtenWait: string
}

/** Bản chất, Tìm sạn and Pattern as drawn, their words and what the learner does on them. */
export type FiveParts = {
    readonly reading: ReadingView | undefined
    readonly bugHunt: BugHuntView | undefined
    readonly pattern: PatternPartView | undefined
    readonly labels: FivePartsLabels
    readonly isLoading: boolean
    readonly on: {
        readonly openBugHint: (testId: string) => void
        readonly selectStack: (stack: string) => void
    }
}

/** What the lesson page hands the hook. */
type FivePartsInput = {
    readonly lesson: LessonView | undefined
    readonly part: EssentialPart
    readonly locale: string
    readonly score: OpenerScoreView | undefined
    /** The name of the online machine; empty when none is online. */
    readonly machine: string
    /** The learner's newest relayed run of each scenario, shown under the Bản chất flows. */
    readonly runs: ReadonlyArray<ScenarioRunView>
}

/** Resolves the words of the three parts. */
const useFivePartsWords = (): {
    readonly labels: FivePartsLabels
    readonly bug: BugWords
    readonly pattern: PatternWords
    readonly run: ReadingRunWords
} => {
    const t = useTranslations("app.essentials.essential.five")
    const journey = useLessonJourneyLabels()
    return {
        labels: {
            reading: {
                tocTitle: t("reading.tocTitle"),
                tocPosition: (index, total) => t("reading.tocPosition", { index, total }),
                checkSummary: (solved, total) => t("reading.checkSummary", { solved, total }),
                flagged: t("reading.flagged"),
                locked: t("reading.locked"),
                checkTitle: t("reading.checkTitle"),
                check: {
                    label: t("reading.checkLabel"),
                    wrong: t("reading.checkWrong"),
                    correct: t("reading.checkCorrect"),
                    whyNot: t("reading.checkWhyNot"),
                    grading: t("reading.checkGrading"),
                },
                glossaryTitle: t("reading.glossaryTitle"),
                glossaryFold: (count) => t("reading.glossaryFold", { count }),
                mcpTitle: t("reading.mcpTitle"),
                mcpNote: t("reading.mcpNote"),
                mcpCopy: t("reading.mcpCopy"),
                mcpDetails: t("reading.mcpDetails"),
                mcpConfig: t("reading.mcpConfig"),
                mcpCommand: t("reading.mcpCommand"),
                mcpToken: t("reading.mcpToken"),
                copy: t("copy"),
                diagram: t("reading.diagram"),
                diagramError: t("reading.diagramError"),
                markdown: journey.markdown,
                code: {
                    copy: journey.markdown.copy ?? t("copy"),
                    copied: journey.markdown.copied ?? t("copy"),
                    copyError: journey.markdown.copyError ?? t("copy"),
                    lines: (first, last) =>
                        first === last ? t("reading.codeLine", { line: first }) : t("reading.codeLines", { first, last }),
                    marked: (count) => t("reading.codeMarked", { count }),
                },
                labTitle: t("reading.labTitle"),
                labLater: t("reading.labLater"),
                runYours: t("reading.runYours"),
                runNone: t("reading.runNone"),
                runOtherGuards: t("reading.runOtherGuards"),
                runLedger: t("reading.runLedger"),
            },
            bugs: {
                pullTitle: t("bugs.pullTitle"),
                pullNote: t("bugs.pullNote"),
                copy: t("copy"),
                runsEmpty: t("bugs.runsEmpty"),
                passTitle: t("bugs.passTitle"),
                testsTitle: (total) => t("bugs.testsTitle", { total }),
                expected: t("bugs.expected"),
                received: t("bugs.received"),
                machineNone: t("bugs.machineNone"),
                machineNoneNote: t("bugs.machineNoneNote"),
                machineOnline: (name) => t("bugs.machineOnline", { name }),
            },
            pattern: {
                intro: t("pattern.intro"),
                stacks: t("pattern.stacks"),
                questions: t("pattern.questions"),
                snippet: t("pattern.snippet"),
                files: (folder) => t("pattern.files", { folder }),
                filesEmpty: t("pattern.filesEmpty"),
                soon: t("pattern.soonText"),
                github: t("pattern.github"),
            },
            journeyTitle: t("journeyTitle"),
            writtenWait: t("written.wait"),
        },
        bug: {
            state: {
                none: t("bugs.state.none"),
                running: t("bugs.state.running"),
                passed: t("bugs.state.passed"),
                failed: t("bugs.state.failed"),
                locked: t("bugs.state.locked"),
            },
            bug: (n) => t("bugs.bug", { n }),
            happy: t("bugs.happy"),
            final: t("bugs.final"),
            hint: (n) => t("bugs.hint", { n }),
            openHint: (n) => t("bugs.openHint", { n }),
            runTitle: (time, passed, total) => t("bugs.runTitle", { time, passed, total }),
            noRun: (total) => t("bugs.noRun", { total }),
        },
        run: {
            state: {
                running: t("reading.runState.running"),
                passed: t("reading.runState.passed"),
                failed: t("reading.runState.failed"),
            },
            caption: (time, guards) => t("reading.runCaption", { time, guards }),
            guardsOn: t("reading.runGuardsOn"),
        },
        pattern: {
            soon: (stack) => t("pattern.soon", { stack }),
            where: t("pattern.where"),
            howFar: t("pattern.howFar"),
            whenDown: t("pattern.whenDown"),
        },
    }
}

/** No result yet: the shape the builders take while the first read runs. */
const NO_RESULTS: ReadonlyArray<BugResultView> = []

/**
 * Bản chất (the practice-led reading, its contents with "Nên đọc kỹ" from the opener misses, and the lesson's MCP), Tìm sạn (the bug
 * pack and the learner's per-test results, read again while a test runs, and its hints opened one at a time) and Pattern (the stack
 * on screen). A part off screen or locked reads nothing.
 */
export const useFiveParts = (input: FivePartsInput): FiveParts => {
    const { lesson, part, locale } = input
    const words = useFivePartsWords()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const lockedParts = lesson?.essential?.lockedParts ?? []
    const hasBugs = (lesson?.essential?.bugs ?? []).length > 0
    const isBugsOpen = part === "scenarios" && hasBugs && !lockedParts.includes("scenarios") && isSignedIn
    const results = useQueryLessonBugResultsSwr(lesson?.id ?? "", locale, isBugsOpen)
    const connection = useQueryMcpTokensSwr(isSignedIn && part === "source")
    const opener = useMutateOpenLessonBugHintSwr()
    const [opening, setOpening] = useState("")
    const [stack, setStack] = useState("")
    const [origin, setOrigin] = useState("")
    useEffect(() => setOrigin(window.location.origin), [])
    const declared = connection.data?.mcpConnectInfo.endpoint ?? "/mcp"
    const endpoint = declared.startsWith("/") ? (origin === "" ? "" : `${origin}${declared}`) : declared
    return {
        reading:
            lesson === undefined
                ? undefined
                : readingOf(lesson, input.score, endpoint, readingRunsOf(input.runs, words.run)),
        bugHunt:
            lesson === undefined
                ? undefined
                : bugHuntOf(lesson, results.data ?? NO_RESULTS, input.machine, opening, words.bug),
        pattern: patternOf(lesson?.essential?.patterns ?? [], stack, words.pattern),
        labels: words.labels,
        isLoading: results.isLoading,
        on: {
            openBugHint: (testId) => {
                if (lesson === undefined) return
                setOpening(testId)
                opener
                    .trigger({ lessonId: lesson.id, testId, locale })
                    .then(() => results.mutate())
                    .catch(() => undefined)
                    .finally(() => setOpening(""))
            },
            selectStack: setStack,
        },
    }
}
