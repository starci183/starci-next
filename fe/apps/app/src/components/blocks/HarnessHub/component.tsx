import { ChoiceChips, Page, Section, Stack, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { HarnessHubScreen, HarnessHubView, HarnessPartRowView } from "@/hooks/harness"

/** Props for {@link HarnessHubBase}: the resolved screen of the hub. */
export type HarnessHubBaseProps = {
    readonly props: HarnessHubScreen["props"]
    readonly on: HarnessHubScreen["on"]
}

/** One part as a list row: its number, what it holds and where the learner stands in it. */
const rowOf = (row: HarnessPartRowView, index: number): ListRowData => ({
    id: row.id,
    title: row.title,
    description: row.description,
    leading: { position: index + 1 },
    badges: [{ label: row.progress, tone: row.isDone ? "success" : "muted" }],
    meta: { text: row.topics },
    href: row.href,
})

/** The ribbon of figures and the list of the three parts. */
const HubBody = (props: {
    readonly view: HarnessHubView
    readonly hub: HarnessHubBaseProps
    readonly isLoading: boolean
}) => (
    <Stack gap="region">
        <Section
            kind="figures"
            ribbon
            ariaLabel={props.hub.props.labels.figuresLabel}
            isLoading={props.isLoading}
            items={props.view.figures.map((figure) => ({
                id: figure.id,
                term: figure.term,
                value: figure.value,
                meta: figure.meta,
            }))}
        />
        <Section
            kind="list"
            title={props.hub.props.labels.partsTitle}
            headingLevel={2}
            count={props.view.parts.length}
            isLoading={props.isLoading}
            items={props.view.parts.map(rowOf)}
            empty={props.hub.props.labels.empty}
        />
    </Stack>
)

/**
 * Draws the harness hub: the band with the four tabs, the ribbon of the learner's progress, the three parts as one flat list, and the
 * tool picker (Claude Code or Codex) the guides and the trials follow.
 */
export const HarnessHubBase = (props: HarnessHubBaseProps) => (
    <Page header={props.props.header}>
        <Stack gap="region">
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retry}
                render={(view, isLoading) => <HubBody view={view} hub={props} isLoading={isLoading} />}
            />
            <Section title={props.props.labels.toolTitle} headingLevel={2} caption={props.props.labels.toolDescription}>
                <ChoiceChips
                    label={props.props.common.toolLabel}
                    isLabelHidden
                    options={props.props.toolOptions}
                    value={props.props.tool}
                    onValueChange={props.on.chooseTool}
                    empty={props.props.labels.empty}
                />
            </Section>
        </Stack>
    </Page>
)
