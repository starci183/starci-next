import { Avatar, Cluster, EmptyNotice, Page, Section, Stack, Text, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The public CV as it is drawn: whose it is and the signed lines. */
export type PublicCvScreenView = {
    readonly name: string
    readonly avatarUrl: string | null
    readonly rows: ReadonlyArray<ListRowData>
}

/** The fake public CV with the geometry of a settled one. */
export const PUBLIC_CV_PLACEHOLDER: PublicCvScreenView = {
    name: "xxxxxxxx",
    avatarUrl: null,
    rows: [1, 2].map((index) => ({ id: `placeholder-${index}`, title: "xxxxxxxxxxxxxxxx", description: "xxxxxxxxxx" })),
}

/** The fixed words of the public CV. */
export type PublicCvLabels = {
    readonly title: string
    readonly linesTitle: string
    readonly note: string
    readonly empty: string
    readonly notFoundTitle: string
    readonly notFoundDescription: string
}

/** Props for {@link PublicCvBase}. */
export type PublicCvBaseProps = {
    /** A link StarCi never issued, or one its owner turned private, draws the not-found notice instead of the slot. */
    readonly shape: "read" | "notFound"
    readonly props: {
        readonly slot: DataSlot<PublicCvScreenView>
        readonly placeholder: PublicCvScreenView
        readonly slotLabels: SlotLabels
        readonly labels: PublicCvLabels
    }
    readonly on: { readonly retry: () => void }
}

/**
 * Draws the public CV a learner chose to share (no drawing yet, composed from Grammar): the name and avatar, then only the lines a
 * teacher signed, each with the source and the date, and the link to its verification. No score and no reviewer name.
 */
export const PublicCvBase = (props: PublicCvBaseProps) => (
    <Page>
        {props.shape === "notFound" ? (
            <EmptyNotice
                scope="page"
                message={props.props.labels.notFoundTitle}
                description={props.props.labels.notFoundDescription}
            />
        ) : (
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => (
                    <Stack gap="region">
                        <Cluster gap="inline" align="center" wrap>
                            <Avatar
                                name={view.name}
                                size="lg"
                                {...(view.avatarUrl === null ? {} : { src: view.avatarUrl })}
                            />
                            <Stack gap="identity">
                                <Text isStrong>{view.name}</Text>
                                <Text size="sm" tone="muted">
                                    {props.props.labels.title}
                                </Text>
                            </Stack>
                        </Cluster>
                        <Section
                            kind="list"
                            title={props.props.labels.linesTitle}
                            headingLevel={2}
                            count={view.rows.length}
                            isLoading={isLoading}
                            caption={props.props.labels.note}
                            items={view.rows}
                            empty={<Text tone="muted">{props.props.labels.empty}</Text>}
                        />
                    </Stack>
                )}
            />
        )}
    </Page>
)
