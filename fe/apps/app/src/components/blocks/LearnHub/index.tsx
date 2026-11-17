"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { hubScreenOf, isGoalInvalid, useHubLabels, useHubWords } from "@/hooks/hub"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useMutateStreakGoalSwr, useQueryLearnerHubSwr, useQueryStreakSwr } from "@/hooks/swr"
import { useAppGuideStore } from "@/hooks/zustand/appGuide"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import { HUB_PLACEHOLDER, LearnHubBase, type HubScreenView } from "./component"

/** The goal the editor offers before the hub has answered. */
const DEFAULT_GOAL = 4

/** The slot of the hub: a signed-out reader is refused in place with the way to sign in, anyone else gets the read. */
const hubSlotOf = (isSignedOut: boolean, slot: DataSlot<HubScreenView>): DataSlot<HubScreenView> =>
    isSignedOut ? { isForbidden: true } : slot

/** The connected learn hub: reads the hub, words every card and edits the weekly goal. */
export const LearnHub = () => {
    const t = useTranslations("app.hub")
    const locale = useLocale()
    const read = useQueryLearnerHubSwr(locale)
    const streak = useQueryStreakSwr()
    const words = useHubWords()
    const write = useMutateStreakGoalSwr()
    const session = useSession()
    const slotLabels = useSlotLabels()(t("today.empty"))
    const [isGoalOpen, setIsGoalOpen] = useState(false)
    const [choice, setChoice] = useState<string | undefined>(undefined)
    const [status, setStatus] = useState("")
    const labels = useHubLabels(status)
    const isGuideOpen = useAppGuideStore((state) => state.isOpen)
    const setGuideOpen = useAppGuideStore((state) => state.setOpen)
    const chosen = choice ?? String(read.data?.streak.week.goal ?? DEFAULT_GOAL)
    const save = async (): Promise<void> => {
        try {
            await write.trigger({ activeDays: Number(chosen), reminder: streak.data?.reminder ?? null })
            setStatus(t("streak.goalSaved"))
            setIsGoalOpen(false)
            await Promise.all([read.mutate(), streak.mutate()])
        } catch (error) {
            setStatus(isGoalInvalid(error) ? t("streak.goalInvalid") : t("streak.goalFailed"))
        }
    }
    return (
        <LearnHubBase
            props={{
                slot: hubSlotOf(
                    session.status === "signed-out",
                    mapSlot(slotOfSwr(read), (hub) => hubScreenOf(hub, words)),
                ),
                placeholder: HUB_PLACEHOLDER,
                slotLabels,
                labels,
                links: {
                    chooseHref: APP_ROUTES.pathsChoose,
                    continueHref: APP_ROUTES.essentials,
                    signInHref: APP_ROUTES.signIn,
                },
                goal: { isOpen: isGoalOpen, value: chosen, isPending: write.isMutating },
                isGuideOpen,
            }}
            on={{
                retry: () => void read.mutate(),
                goalOpenChange: (isOpen) => {
                    setIsGoalOpen(isOpen)
                    setStatus("")
                },
                goalChoose: setChoice,
                goalSave: () => void save(),
                guideOpenChange: setGuideOpen,
            }}
        />
    )
}
