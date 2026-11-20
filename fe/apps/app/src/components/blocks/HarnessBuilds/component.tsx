import { Page, Section, Tabs, type ListRowData } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { HarnessBuildItemView, HarnessBuildsScreen } from "@/hooks/harnessBuild"

/** Props for {@link HarnessBuildsBase}: the resolved screen of the list of builds. */
export type HarnessBuildsBaseProps = {
    readonly props: HarnessBuildsScreen["props"]
    readonly on: HarnessBuildsScreen["on"]
}

/** One build as a row: its title and summary, the stack as its meta, the stage count and the e2e count as chips. */
const rowOf = (build: HarnessBuildItemView): ListRowData => ({
    id: build.id,
    title: build.title,
    description: build.summary,
    badges: [
        { label: build.proved, tone: build.isDone ? "success" : "muted" },
        { label: build.practising, tone: "muted" },
    ],
    meta: { text: build.keys },
    href: build.href,
})

/** Draws the builds of part 1 as one flat list, each with its e2e and stage counts. */
export const HarnessBuildsBase = (props: HarnessBuildsBaseProps) => (
    <Page header={props.props.header}>
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(builds, isLoading) => (
                <Section
                    kind="list"
                    title={props.props.labels.listTitle}
                    headingLevel={2}
                    count={builds.length}
                    isLoading={isLoading}
                    filter={
                        <Tabs
                            kind="filter"
                            label={props.props.labels.filterLabel}
                            items={props.props.tabs.map((tab) => ({ id: tab.id, label: tab.label, count: tab.count }))}
                            selectedKey={props.props.filter}
                            onSelect={props.on.filter}
                        />
                    }
                    items={builds.map(rowOf)}
                    empty={props.props.labels.empty}
                />
            )}
        />
    </Page>
)
