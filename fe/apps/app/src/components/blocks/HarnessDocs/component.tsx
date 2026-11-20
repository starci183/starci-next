import { Page, Section, SearchField, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { HarnessDocItemView, HarnessDocsScreen } from "@/hooks/harnessDocs"

/** Props for {@link HarnessDocsBase}: the resolved screen of the list of articles. */
export type HarnessDocsBaseProps = {
    readonly props: HarnessDocsScreen["props"]
    readonly on: HarnessDocsScreen["on"]
}

/** One article as a row: its title, its summary and its reading time. */
const rowOf = (doc: HarnessDocItemView): ListRowData => ({
    id: doc.slug,
    title: doc.title,
    description: doc.summary,
    href: doc.href,
})

/** Draws the articles of part 3 as one flat list. */
export const HarnessDocsBase = (props: HarnessDocsBaseProps) => (
    <Page header={props.props.header}>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(docs, isLoading) => (
                <Section
                    kind="list"
                    title={props.props.labels.listTitle}
                    headingLevel={2}
                    count={docs.length}
                    isLoading={isLoading}
                    filter={
                        <SearchField
                            label={props.props.labels.filterLabel}
                            isLabelHidden
                            placeholder={props.props.labels.filterPlaceholder}
                            value={props.props.query}
                            onValueChange={props.on.search}
                            onClear={() => props.on.search("")}
                            clearLabel={props.props.labels.clearLabel}
                            measure="toolbar"
                        />
                    }
                    items={docs.map(rowOf)}
                    empty={props.props.labels.empty}
                />
            )}
        />
    </Page>
)
