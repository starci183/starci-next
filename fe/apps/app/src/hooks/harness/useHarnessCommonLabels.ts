"use client"

import { useTranslations } from "next-intl"
import type { HarnessCommonLabels } from "./harness.shared"

/** The words every harness page shares, resolved once. */
export const useHarnessCommonLabels = (): HarnessCommonLabels => {
    const t = useTranslations("app.harness")
    return {
        pageTitle: t("pageTitle"),
        breadcrumbs: t("breadcrumbs"),
        tabsLabel: t("tabs.label"),
        tabs: {
            overview: t("tabs.overview"),
            build: t("tabs.build"),
            use: t("tabs.use"),
            docs: t("tabs.docs"),
        },
        tools: { claude: t("tools.claude"), codex: t("tools.codex") },
        toolLabel: t("tools.label"),
        outcomes: {
            green: t("outcomes.green"),
            red: t("outcomes.red"),
            untested: t("outcomes.untested"),
            running: t("outcomes.running"),
        },
        proofs: { NONE: t("proofs.none"), PRACTISING: t("proofs.practising"), PROVED: t("proofs.proved") },
        probes: { pass: t("probes.pass"), fail: t("probes.fail"), skipped: t("probes.skipped") },
        verdicts: {
            clean: t("verdicts.clean"),
            shortcut: t("verdicts.shortcut"),
            incomplete: t("verdicts.incomplete"),
            untested: t("verdicts.untested"),
        },
        copy: { copy: t("copy.copy"), copied: t("copy.copied"), copyError: t("copy.error") },
        markdown: {
            copy: t("copy.copy"),
            copied: t("copy.copied"),
            copyError: t("copy.error"),
            diagram: t("markdown.diagram"),
            diagramError: t("markdown.diagramError"),
            table: t("markdown.table"),
        },
    }
}
