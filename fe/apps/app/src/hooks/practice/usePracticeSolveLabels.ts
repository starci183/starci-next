"use client"

import { useTranslations } from "next-intl"
import type { PracticeEditorLabels, PracticeHintsLabels, PracticeProblemLabels } from "@starci-next/ui"

/** The words of the statement panel, the editor and the hint ladder. */
export type PracticeSolveCopy = {
    readonly problem: PracticeProblemLabels
    readonly editor: PracticeEditorLabels
    readonly hints: PracticeHintsLabels
}

/** Resolves the words of the statement panel, the editor and the hint ladder. */
export const usePracticeSolveLabels = (): PracticeSolveCopy => {
    const t = useTranslations("app.practice")
    return {
        problem: {
            examples: t("problem.examples"),
            input: t("problem.input"),
            output: t("problem.output"),
            diagram: t("problem.diagram"),
            diagramError: t("problem.diagramError"),
        },
        editor: {
            title: t("editor.title"),
            language: t("editor.language"),
            code: t("editor.code"),
            judgeNote: t("editor.judgeNote"),
            run: t("editor.run"),
            submit: t("editor.submit"),
            reset: t("editor.reset"),
            working: t("editor.working"),
            draftSaved: t("editor.draftSaved"),
        },
        hints: {
            title: t("hints.title"),
            note: t("hints.note"),
            reveal: t("hints.reveal"),
            revealing: t("hints.revealing"),
            done: t("hints.done"),
            step: (step, total) => t("hints.step", { step, total }),
            diagram: t("problem.diagram"),
            diagramError: t("problem.diagramError"),
        },
    }
}
