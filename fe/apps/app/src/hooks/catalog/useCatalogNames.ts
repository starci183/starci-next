"use client"

import { useTranslations } from "next-intl"

/** The spoken names of the implementation languages, the same in every locale. */
const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    go: "Go",
    python: "Python",
    java: "Java",
    kubernetes: "Kubernetes",
}

/** What the lesson study page names: the group a lesson is filed under and the language of its source. */
type CatalogNames = {
    readonly groups: Readonly<Record<string, string>>
    readonly languageNames: Readonly<Record<string, string>>
}

/** Resolves the names of the knowledge groups and of the languages, by id. */
export const useCatalogNames = (): CatalogNames => {
    const t = useTranslations("app.essentials")
    return {
        groups: {
            backend: t("groups.backend"),
            frontend: t("groups.frontend"),
            data: t("groups.data"),
            caching: t("groups.caching"),
            messaging: t("groups.messaging"),
            realtime: t("groups.realtime"),
            distributed: t("groups.distributed"),
            security: t("groups.security"),
            testing: t("groups.testing"),
            observability: t("groups.observability"),
            infra: t("groups.infra"),
            delivery: t("groups.delivery"),
            cloud: t("groups.cloud"),
            integrations: t("groups.integrations"),
            ai: t("groups.ai"),
            casestudy: t("groups.casestudy"),
        },
        languageNames: LANGUAGE_NAMES,
    }
}
