"use client"

import { useTranslations } from "next-intl"
import { failureCodeOf, plainLineOf, useExperienceWords } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryVerifyExperienceSwr } from "@/hooks/swr"
import { VERIFICATION_PLACEHOLDER, VerifyExperienceBase } from "./component"

/** What the route hands the block: the public code of the address. */
type VerifyExperienceProps = { readonly code: string }

/** The code a door answers for a code StarCi never verified. */
const NOT_FOUND = "CAREER_ITEM_NOT_FOUND"

/** The public verification page: reads one code without a session and words the signed line, the role and the date. */
export const VerifyExperience = (props: VerifyExperienceProps) => {
    const t = useTranslations("app.experience.verify")
    const words = useExperienceWords()
    const code = decodeURIComponent(props.code)
    const read = useQueryVerifyExperienceSwr(code)
    const isNotFound = read.error !== undefined && failureCodeOf(read.error) === NOT_FOUND
    return (
        <VerifyExperienceBase
            shape={isNotFound ? "notFound" : "read"}
            props={{
                slot: mapSlot(slotOfSwr(read), (view) => ({
                    isRevoked: view.state === "revoked",
                    title: view.state === "revoked" ? t("revokedTitle") : t("verifiedTitle"),
                    sub:
                        view.state === "revoked" && view.revokedAt
                            ? t("revokedSub", { date: words.date(view.revokedAt) })
                            : t("verifiedSub", { role: words.role(view.signerRole), date: words.date(view.signedAt) }),
                    line: plainLineOf(view.line.vi),
                    facts: [
                        { term: t("part"), value: words.part(view.part) },
                        {
                            term: t("evidence"),
                            value: view.evidenceKinds.map((kind) => words.evidence(kind)).join(", "),
                        },
                        { term: t("code"), value: view.code },
                    ],
                })),
                placeholder: VERIFICATION_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("notFoundTitle")),
                note: t("note"),
                notFoundTitle: t("notFoundTitle"),
                notFoundDescription: t("notFoundDescription"),
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
