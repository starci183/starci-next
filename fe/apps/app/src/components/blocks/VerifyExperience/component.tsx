import {
    Alert,
    Cluster,
    DescriptionList,
    Divider,
    EmptyNotice,
    Page,
    Section,
    Stack,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import { Skeleton } from "@heroui/react"
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

/** The view SlotView is handed for its loading branch; the block draws {@link VerificationSkeleton} instead, so it carries no words. */
export const VERIFICATION_PLACEHOLDER: VerificationScreenView = {
    isRevoked: false,
    title: "",
    sub: "",
    line: "",
    facts: [],
}

/** The public facts the settled page lists (part, evidence, signer, date, code): one bar pair each while loading. */
const FACT_ROWS = ["part", "evidence", "signer", "signedOn", "code"] as const

/**
 * The verification while its read is in flight: no status, line, title, term or note word and no tone, only the geometry of the settled
 * page as bars (the status with its mark, the signed line, the facts with their dividers, the note).
 */
const VerificationSkeleton = () => (
    <Stack gap="row">
        <Cluster gap="row" align="start" wrap={false}>
            <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
            <Stack gap="row">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-4 w-64 rounded-md" />
            </Stack>
        </Cluster>
        <Skeleton className="h-4 w-2/3 rounded-md" />
        <Stack gap="section">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Stack gap="row">
                {FACT_ROWS.map((id) => (
                    <Stack key={id} gap="row">
                        <Skeleton className="h-3 w-24 rounded-md" />
                        <Skeleton className="h-4 w-48 rounded-md" />
                        <Divider />
                    </Stack>
                ))}
            </Stack>
        </Stack>
        <Skeleton className="h-4 w-2/3 rounded-md" />
    </Stack>
)

/** Props for {@link VerifyExperienceBase}. */
export type VerifyExperienceBaseProps = {
    /** A code StarCi never verified draws the not-found notice instead of the slot. */
    readonly shape: "read" | "notFound"
    readonly props: {
        readonly slot: DataSlot<VerificationScreenView>
        readonly placeholder: VerificationScreenView
        readonly slotLabels: SlotLabels
        readonly note: string
        readonly factsTitle: string
        readonly notFoundTitle: string
        readonly notFoundDescription: string
        /** The public top bar: brand, language and the way in. */
        readonly top: ReactNode
        readonly homeLabel: string
        readonly homeHref: string
    }
    readonly on: { readonly retry: () => void }
}

/**
 * Draws the public verification of one CV line for a recruiter (Program screen verify): Verified by StarCi with the signer
 * role and date, or the revoked state with its date; the line and the public facts. No score, no source code, no reviewer name.
 */
export const VerifyExperienceBase = (props: VerifyExperienceBaseProps) => (
    <Page>
        <Stack gap="region">
            {props.props.top}
            {props.shape === "notFound" ? (
                <EmptyNotice
                    scope="page"
                    message={props.props.notFoundTitle}
                    description={props.props.notFoundDescription}
                    actionVariant="border"
                    actionLabel={props.props.homeLabel}
                    actionHref={props.props.homeHref}
                />
            ) : (
                <SlotView
                    slot={props.props.slot}
                    placeholder={props.props.placeholder}
                    labels={props.props.slotLabels}
                    onRetry={props.on.retry}
                    render={(view, isLoading) =>
                        isLoading ? (
                            <VerificationSkeleton />
                        ) : (
                            <Stack gap="row">
                                <Alert
                                    tone={view.isRevoked ? "negative" : "affirmative"}
                                    isLoading={isLoading}
                                    title={view.title}
                                    description={view.sub}
                                />
                                <Text as="p" isLoading={isLoading}>
                                    {view.line}
                                </Text>
                                <Section title={props.props.factsTitle} headingLevel={2} isLoading={isLoading}>
                                    <DescriptionList
                                        isDivided
                                        isLoading={isLoading}
                                        items={view.facts.map((fact) => ({
                                            id: fact.term,
                                            term: fact.term,
                                            description: fact.value,
                                        }))}
                                    />
                                </Section>
                                <Text tone="muted" isLoading={isLoading}>
                                    {props.props.note}
                                </Text>
                            </Stack>
                        )
                    }
                />
            )}
        </Stack>
    </Page>
)
