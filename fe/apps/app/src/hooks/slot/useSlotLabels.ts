"use client"

import { useTranslations } from "next-intl"
import type { SlotLabels } from "@/modules/types"

/** Resolves the shared data-status copy once, adding the slot's own empty sentence. */
export const useSlotLabels = () => {
    const t = useTranslations("app.slot")
    return (empty: string, failure?: { readonly title: string; readonly text: string }): SlotLabels => ({
        empty,
        forbidden: t("forbidden"),
        error: failure?.title ?? t("error"),
        ...(failure === undefined ? {} : { errorDescription: failure.text }),
        retry: t("retry"),
    })
}
