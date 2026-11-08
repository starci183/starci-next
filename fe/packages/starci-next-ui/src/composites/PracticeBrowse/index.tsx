import { Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { PracticeList, type PracticeRow } from "../PracticeList"
import { SlotView, type DataSlot, type SlotLabels } from "../SlotView"
import { UpsellRow } from "../UpsellRow"

/** The Premium upsell of a browse screen: the words and where the plans are. */
export type PracticeBrowseUpsell = { readonly label: string; readonly note: string; readonly href: string }

/** What a browse screen draws once its read settles: the muted lines of the card and the rows. */
export type PracticeBrowseView = {
    /** The muted lines of the card, in order. */
    readonly lines: ReadonlyArray<string>
    readonly rows: ReadonlyArray<PracticeRow>
}

/** A browse screen of Practice code: a card of notes above a list of rows, with the status of its read. */
export type PracticeBrowseProps = {
    readonly slot: DataSlot<PracticeBrowseView>
    readonly placeholder: PracticeBrowseView
    readonly slotLabels: SlotLabels
    readonly onRetry: () => void
    readonly cardLabel: string
    /** The paragraph that opens the card; empty draws none. */
    readonly intro: string
    readonly upsell: PracticeBrowseUpsell | undefined
    readonly listLabel: string
    readonly emptyLabel: string
}

/** The body of the catalog and the pattern screens: a soft card with its notes and the Premium upsell, then the rows. */
export const PracticeBrowse = (props: PracticeBrowseProps) => (
    <SlotView
        slot={props.slot}
        placeholder={props.placeholder}
        labels={props.slotLabels}
        onRetry={props.onRetry}
        render={(view, isLoading) => (
            <Stack gap="region">
                <SurfaceCard treatment="soft" label={props.cardLabel} isLoading={isLoading}>
                    <Stack gap="row">
                        {props.intro === "" ? null : <Text as="p">{props.intro}</Text>}
                        {view.lines.map((line) => (
                            <Text key={line} size="sm" tone="muted">
                                {line}
                            </Text>
                        ))}
                        {props.upsell === undefined ? null : <UpsellRow {...props.upsell} />}
                    </Stack>
                </SurfaceCard>
                <PracticeList
                    label={props.listLabel}
                    emptyLabel={props.emptyLabel}
                    rows={view.rows}
                    isLoading={isLoading}
                />
            </Stack>
        )}
    />
)
