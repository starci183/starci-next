import { Alert, DescriptionList, EmptyNotice, Page, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The verification as it is drawn: verified or revoked, the signed line and the public facts. */
export type VerificationScreenView = {
    readonly isRevoked: boolean
    readonly title: string
    readonly sub: string
    readonly line: string
    readonly facts: ReadonlyArray<{ readonly term: string; readonly value: string }>
}

/** The fake verification with the geometry of a settled one. */
export const VERIFICATION_PLACEHOLDER: VerificationScreenView = {
    isRevoked: false,
    title: "xxxxxxxxxx",
    sub: "xxxxxxxxxxxxxx",
    line: "xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    facts: [{ term: "xxxxxx", value: "xxxxxxxx" }],
}

/** Props for {@link VerifyExperienceBase}. */
export type VerifyExperienceBaseProps = {
    /** A code StarCi never verified draws the not-found notice instead of the slot. */
    readonly shape: "read" | "notFound"
    readonly props: {
        readonly slot: DataSlot<VerificationScreenView>
        readonly placeholder: VerificationScreenView
        readonly slotLabels: SlotLabels
        readonly note: string
        readonly notFoundTitle: string
        readonly notFoundDescription: string
    }
    readonly on: { readonly retry: () => void }
}

/**
 * Draws the public verification of one CV line for a recruiter (Program screen verify): Verified by StarCi with the signer
 * role and date, or the revoked state with its date; the line and the public facts. No score, no source code, no reviewer name.
 */
export const VerifyExperienceBase = (props: VerifyExperienceBaseProps) => (
    <Page>
        {props.shape === "notFound" ? (
            <EmptyNotice message={props.props.notFoundTitle} description={props.props.notFoundDescription} />
        ) : (
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view) => (
                    <SurfaceCard ariaLabel={view.title} measure="content">
                        <Stack gap="row">
                            <Alert
                                tone={view.isRevoked ? "negative" : "affirmative"}
                                title={view.title}
                                description={view.sub}
                            />
                            <Text as="p">{view.line}</Text>
                            <DescriptionList
                                items={view.facts.map((fact) => ({
                                    id: fact.term,
                                    term: fact.term,
                                    description: fact.value,
                                }))}
                            />
                            <Text size="sm" tone="muted">
                                {props.props.note}
                            </Text>
                        </Stack>
                    </SurfaceCard>
                )}
            />
        )}
    </Page>
)
