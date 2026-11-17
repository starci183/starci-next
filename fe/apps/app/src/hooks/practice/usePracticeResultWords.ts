"use client"

import { useTranslations } from "next-intl"
import type { PracticeResultLabels } from "@starci-next/ui"
import type { PracticeResultWords } from "@/modules/practice-result"

/** The words of the result card: the verdicts and tests it names, and the labels it draws. */
export type PracticeResultCopy = {
    readonly words: PracticeResultWords
    readonly labels: PracticeResultLabels
}

/** Resolves the words of the result card. */
export const usePracticeResultWords = (): PracticeResultCopy => {
    const t = useTranslations("app.practice")
    return {
        words: {
            verdicts: {
                QUEUED: t("verdict.queued"),
                RUNNING: t("verdict.running"),
                ACCEPTED: t("verdict.accepted"),
                WRONG_ANSWER: t("verdict.wrongAnswer"),
                TIME_LIMIT_EXCEEDED: t("verdict.timeLimit"),
                COMPILE_ERROR: t("verdict.compileError"),
                RUNTIME_ERROR: t("verdict.runtimeError"),
                INTERNAL_ERROR: t("verdict.internalError"),
            },
            testStatuses: {
                Accepted: t("verdict.accepted"),
                "Wrong Answer": t("verdict.wrongAnswer"),
                "Time Limit Exceeded": t("verdict.timeLimit"),
                "Compilation Error": t("verdict.compileError"),
                "Runtime Error": t("verdict.runtimeError"),
                "Internal Error": t("verdict.internalError"),
            },
            example: (position) => t("result.example", { position }),
            hidden: (position) => t("result.hidden", { position }),
            summary: (passed, total) => t("result.summary", { passed, total }),
            followUp: (nextSlug) => (nextSlug === null ? t("result.followUpLast") : t("result.followUp")),
            runNote: t("result.runNote"),
            judgeDown: t("result.judgeDown"),
        },
        labels: {
            title: t("result.title"),
            queued: t("result.queued"),
            running: t("result.running"),
            compileOutput: t("result.compileOutput"),
            input: t("result.input"),
            expected: t("result.expected"),
            actual: t("result.actual"),
            tests: t("result.tests"),
            testsEmpty: t("result.testsEmpty"),
            passed: t("result.passed"),
            failed: t("result.failed"),
        },
    }
}
