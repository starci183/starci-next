"use client"

import { useTranslations } from "next-intl"
import { plainLineOf, stateToneOf, useExperienceWords } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryMyExperienceSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import { PROFILE_PLACEHOLDER, ProfileExperienceBase } from "./component"

/** The connected profile: the learner's items with the verified ones first, and the count the hiring bridge needs. */
export const ProfileExperience = () => {
    const t = useTranslations("app.experience.profile")
    const words = useExperienceWords()
    const read = useQueryMyExperienceSwr(undefined)
    return (
        <ProfileExperienceBase
            props={{
                slot: mapSlot(slotOfSwr(read), (data) => {
                    const verified = data.items.filter((item) => item.state === "verified")
                    const rest = data.items.filter((item) => item.state !== "verified")
                    return {
                        gate: t("gate", { count: verified.length, min: data.hiringMinVerified }),
                        rows: [...verified, ...rest].map((item) => ({
                            itemId: item.itemId,
                            part: words.part(item.part),
                            title: plainLineOf((item.line ?? item.draftLine)?.vi ?? item.subject),
                            evidence: item.evidence.map((evidence) => words.evidence(evidence.kind)).join(", "),
                            state: words.state(item.state),
                            stateTone: stateToneOf(item.state),
                        })),
                    }
                }),
                placeholder: PROFILE_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("empty")),
                labels: {
                    title: t("title"),
                    description: t("description"),
                    listTitle: t("listTitle"),
                    seeAll: t("seeAll"),
                    seeAllHref: APP_ROUTES.experience,
                    publicNote: t("publicNote"),
                    cvLater: t("cvLater"),
                },
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
