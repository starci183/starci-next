"use client"

import { useTranslations } from "next-intl"
import type { PathWords } from "./paths.shared"

/** Resolves the words the path cards are drawn with: the kind of each path and the size line. */
export const usePathWords = (): PathWords => {
    const t = useTranslations("app.paths")
    return {
        kind: { build: t("kind.build"), agent: t("kind.agent"), job: t("kind.job") },
        meta: (steps, weeks) => t("meta", { steps, weeks }),
    }
}
