"use client"

import { useTranslations } from "next-intl"
import { PublicTopBar } from "@/components/blocks/PublicTopBar"
import { usePublicCvLabels } from "@/hooks/publicCv"
import { failureCodeOf, plainLineOf, useExperienceWords } from "@/hooks/experience"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryVerifyExperienceSwr } from "@/hooks/swr"
import { VERIFICATION_PLACEHOLDER, VerifyExperienceBase } from "./component"

/** What the route hands the block: the public code of the address. */
type VerifyExperienceProps = { readonly code: string }

/** The codes a door answers for a code StarCi never verified: an unknown one, and one that is not three groups of four letters and digits. */
const NOT_FOUND_CODES: ReadonlySet<string> = new Set(["CAREER_ITEM_NOT_FOUND", "HTTP_SECURITY_REQUEST_INVALID"])

/** The public verification page: reads one code without a session and words the signed line, the role and the date. */
export const VerifyExperience = (props: VerifyExperienceProps) => {
    const t = useTranslations("app.experience.verify")
    const words = useExperienceWords()
    const publicLabels = usePublicCvLabels()
    const code = decodeURIComponent(props.code)
    const read = useQueryVerifyExperienceSwr(code)
    const isNotFound = read.error !== undefined && NOT_FOUND_CODES.has(failureCodeOf(read.error))
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
                        { term: t("signer"), value: words.role(view.signerRole) },
                        { term: t("signedOn"), value: words.date(view.signedAt) },
                        { term: t("code"), value: view.code },
                    ],
                })),
                placeholder: VERIFICATION_PLACEHOLDER,
                slotLabels: useSlotLabels()(t("notFoundTitle"), { title: t("errorTitle"), text: t("errorText") }),
                note: t("note"),
                factsTitle: t("factsTitle"),
                notFoundTitle: t("notFoundTitle"),
                notFoundDescription: t("notFoundDescription"),
                top: <PublicTopBar />,
                homeLabel: publicLabels.notFoundHome,
                homeHref: publicLabels.homeHref,
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
