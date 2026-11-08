"use client"

import { useTranslations } from "next-intl"
import { useViewerPremium } from "./useViewerPremium"
import type { CatalogWords } from "@/modules/types"

/** The spoken names of the implementation languages, the same in every locale. */
const LANGUAGE_NAMES: CatalogWords["languageNames"] = {
    typescript: "TypeScript",
    javascript: "JavaScript",
    go: "Go",
    python: "Python",
    java: "Java",
    kubernetes: "Kubernetes",
}

/** The names of the cloud providers, the same in every locale. */
const PROVIDER_NAMES: CatalogWords["providerNames"] = {
    aws: "AWS",
    gcp: "GCP",
    azure: "Azure",
    digitalocean: "DigitalOcean",
}

/** Resolves the words the catalog view is built with: the group names, the difficulties, the status of a lesson and the counts. */
export const useCatalogWords = (): CatalogWords => {
    const t = useTranslations("app.essentials")
    const isPremium = useViewerPremium()
    const phases: Readonly<Record<string, string>> = {
        overview: t("phases.overview.title"),
        challenge: t("phases.challenge.title"),
        predict: t("phases.predict.title"),
        explore: t("phases.explore.title"),
        explain: t("phases.explain.title"),
        apply: t("phases.apply.title"),
        reflect: t("phases.reflect.title"),
        review: t("phases.review.title"),
    }
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
        difficulty: {
            foundation: t("difficulty.foundation"),
            intermediate: t("difficulty.intermediate"),
            advanced: t("difficulty.advanced"),
        },
        statuses: {
            none: t("catalog.statusNone"),
            doing: t("catalog.statusDoing"),
            understood: t("catalog.statusUnderstood"),
            proved: t("catalog.statusProved"),
            free: t("catalog.statusFree"),
        },
        isPremium,
        phases,
        resume: (phase) => t("catalog.resumePhase", { phase: phases[phase] ?? phase }),
        understood: (done, total) => t("catalog.topicUnderstood", { done, total }),
        all: t("catalog.all"),
        minutes: (minutes) => t("catalog.minutes", { minutes }),
        count: (count) => t("catalog.count", { count }),
        published: (count) => t("catalog.published", { count }),
        groupCount: (count) => t("catalog.groupCount", { count }),
        topicOpen: (count) => t("catalog.topicOpen", { count }),
        openOfTotal: (open, total) => t("topic.openFacts", { open, total }),
        topicCount: (count) => t("catalog.topicCount", { count }),
        matchCount: (count) => t("catalog.matchCount", { count }),
        sources: (count) => t("catalog.sources", { count }),
        pendingGroup: (count) => t("catalog.pendingGroup", { count }),
        source: (from) => t("topic.source", { from }),
        topicKind: t("catalog.topicKind"),
        soon: t("catalog.soon"),
        languageNames: LANGUAGE_NAMES,
        providerNames: PROVIDER_NAMES,
        cases: [
            { id: "webhook", title: t("cases.webhook.title"), needs: t("cases.webhook.needs") },
            { id: "wallet", title: t("cases.wallet.title"), needs: t("cases.wallet.needs") },
            { id: "flashsale", title: t("cases.flashsale.title"), needs: t("cases.flashsale.needs") },
            { id: "chat", title: t("cases.chat.title"), needs: t("cases.chat.needs") },
        ],
        casesMeta: t("catalog.casesMeta"),
        casesPending: t("catalog.casesPending"),
        caseBadge: t("catalog.caseBadge"),
    }
}
