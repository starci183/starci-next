"use client"

import { useLocale } from "next-intl"
import { useSession } from "@/hooks/auth"
import { pathsScreenOf, usePathChoice, usePathsLabels, usePathWords } from "@/hooks/paths"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryOutcomePathsSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import { PATHS_PLACEHOLDER, PathsChooseBase, type PathsScreenView } from "./component"

/** The slot of the goal screen: a signed-out reader is refused in place with the way to sign in, anyone else gets the read. */
const pathsSlotOf = (isSignedOut: boolean, slot: DataSlot<PathsScreenView>): DataSlot<PathsScreenView> =>
    isSignedOut ? { isForbidden: true } : slot

/** The connected goal screen: reads the outcome paths, words every card and saves the path the learner chooses. */
export const PathsChoose = () => {
    const locale = useLocale()
    const read = useQueryOutcomePathsSwr(locale)
    const words = usePathWords()
    const labels = usePathsLabels()
    const choice = usePathChoice(read)
    const session = useSession()
    return (
        <PathsChooseBase
            props={{
                slot: pathsSlotOf(
                    session.status === "signed-out",
                    mapSlot(slotOfSwr(read), (paths) => pathsScreenOf(paths, words)),
                ),
                placeholder: PATHS_PLACEHOLDER,
                slotLabels: useSlotLabels()(labels.empty),
                labels,
                openId: choice.openId,
                confirmId: choice.confirmId,
                hasActive: choice.hasActive,
                isPending: choice.isPending,
                status: choice.status,
                signInHref: APP_ROUTES.signIn,
            }}
            on={{
                retry: () => void read.mutate(),
                view: choice.view,
                viewClose: choice.viewClose,
                choose: choice.choose,
                confirm: choice.confirm,
                cancel: choice.cancel,
            }}
        />
    )
}
