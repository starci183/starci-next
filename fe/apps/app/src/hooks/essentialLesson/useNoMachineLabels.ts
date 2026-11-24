"use client"

import { useTranslations } from "next-intl"
import type { NoMachineDetailsLabels } from "@starci-next/ui"

/** The words under "Chi tiết kỹ thuật" of the no-machine notice: the fold, the two commands and the copy states. */
export const useNoMachineLabels = (): NoMachineDetailsLabels => {
    const t = useTranslations("app.essentials.essential.noMachine")
    return {
        title: t("title"),
        install: t("install"),
        login: t("login"),
        copy: t("copy"),
        copied: t("copied"),
        copyFailed: t("copyFailed"),
    }
}
