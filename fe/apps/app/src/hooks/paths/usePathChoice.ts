"use client"

import { navigation } from "@starci-next/i18n/navigation"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useMutateChooseOutcomePathSwr, useQueryOutcomePathsSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { isPathNotFound } from "./paths.shared"

/** What the goal screen holds and does while the learner looks at paths and chooses one. */
export type PathChoiceModel = {
    /** The path whose dialog is open. */
    readonly openId: string | undefined
    /** The path the learner is asked to confirm a switch to. */
    readonly confirmId: string | undefined
    /** The learner follows a path already, so choosing another one is a switch. */
    readonly hasActive: boolean
    readonly isPending: boolean
    /** The result of the last choice in words; empty when nothing happened. */
    readonly status: string
    readonly view: (id: string) => void
    readonly viewClose: () => void
    readonly choose: (id: string) => void
    readonly confirm: () => void
    readonly cancel: () => void
}

/**
 * The work of the goal screen: which path is open, the confirmation before a switch and the save. A saved choice leaves for the
 * hub, where the followed path shows with its next steps; a refused one becomes a sentence under the intro.
 */
export const usePathChoice = (read: ReturnType<typeof useQueryOutcomePathsSwr>): PathChoiceModel => {
    const t = useTranslations("app.paths")
    const router = navigation.useRouter()
    const write = useMutateChooseOutcomePathSwr()
    const [openId, setOpenId] = useState<string | undefined>(undefined)
    const [confirmId, setConfirmId] = useState<string | undefined>(undefined)
    const [status, setStatus] = useState("")
    const activeId = read.data?.activePathId ?? undefined
    const save = async (pathId: string): Promise<void> => {
        setStatus("")
        try {
            await write.trigger({ pathId })
            await read.mutate()
            setOpenId(undefined)
            setConfirmId(undefined)
            router.push(APP_ROUTES.home)
        } catch (error) {
            setConfirmId(undefined)
            setStatus(isPathNotFound(error) ? t("status.notFound") : t("status.failed"))
        }
    }
    return {
        openId,
        confirmId,
        hasActive: activeId !== undefined,
        isPending: write.isMutating,
        status,
        view: setOpenId,
        viewClose: () => setOpenId(undefined),
        choose: (pathId) => {
            if (activeId !== undefined && activeId !== pathId) {
                setOpenId(undefined)
                setConfirmId(pathId)
                return
            }
            void save(pathId)
        },
        confirm: () => {
            if (confirmId !== undefined) void save(confirmId)
        },
        cancel: () => setConfirmId(undefined),
    }
}
