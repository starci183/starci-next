import { Button, EmptyNotice, Page, Pane, PaneGrid, PaneSection, type PageHeaderContent } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { DoneIcon, LockIcon, SlotView } from "@starci-next/ui"
import type { EssentialLessonScreen, EssentialLessonView } from "@/hooks/essentialLesson"
import type { DataSlot } from "@/modules/types"
import type { PartContext, PartLayout, PartLayoutOf } from "./layout"
import { applyLayout } from "./parts/partApply"
import { essenceLayout } from "./parts/partEssence"
import { lockedLayout } from "./parts/partLocked"
import { scenariosLayout } from "./parts/partScenarios"
import { sourceLayout } from "./parts/partSource"

/** Props for {@link EssentialLessonBase}: the resolved props and the actions of the screen. */
export type EssentialLessonBaseProps = {
    readonly props: EssentialLessonScreen["props"]
    readonly on: EssentialLessonScreen["on"]
}

/** The layout of each part; a part the reader's plan lacks is drawn by the locked layout instead. */
const LAYOUTS: Readonly<Record<EssentialLessonView["part"], PartLayoutOf>> = {
    essence: essenceLayout,
    source: sourceLayout,
    scenarios: scenariosLayout,
    apply: applyLayout,
}

/** The lesson the band draws: the settled one, the placeholder while the first read runs, none otherwise. */
const lessonOfSlot = (
    slot: DataSlot<EssentialLessonView>,
    placeholder: EssentialLessonView,
): EssentialLessonView | undefined => {
    if ("items" in slot) return slot.items
    if ("isLoading" in slot) return placeholder
    return undefined
}

/** What a tab wears at its start: the lock of a part Premium unlocks, the check of a finished one. */
const markOf = (tab: EssentialLessonView["tabs"][number], props: EssentialLessonBaseProps): ReactNode => {
    if (tab.state === "locked") return <LockIcon label={props.props.shell.tabLocked} />
    return tab.state === "done" ? <DoneIcon label={props.props.shell.tabDone} /> : undefined
}

/** What the layout of the part on screen is built from. */
const layoutOf = (context: PartContext): PartLayout => {
    const { lesson, screen } = context
    if (lesson.isLocked) return lockedLayout(context)
    if (lesson.isEmpty && lesson.part !== "essence") {
        return { main: <EmptyNotice message={screen.props.page.soon} />, aside: undefined, action: undefined }
    }
    return LAYOUTS[lesson.part](context)
}

/** The band: the trail through the topic, the title, the problem the lesson solves, its facts, the primary of the part and the four parts as page tabs. */
const bandOf = (
    lesson: EssentialLessonView,
    layout: PartLayout,
    props: EssentialLessonBaseProps,
): PageHeaderContent => ({
    breadcrumbs: {
        label: props.props.page.breadcrumbs,
        items: [
            { id: "essentials", label: props.props.page.pageTitle, href: props.props.catalogHref },
            { id: "topic", label: lesson.topic.title, href: lesson.topic.href },
            { id: "lesson", label: lesson.title },
        ],
    },
    title: lesson.title,
    titleScale: "standard",
    ...(lesson.subtitle === "" ? {} : { description: lesson.subtitle }),
    meta: lesson.facts,
    ...(layout.action === undefined ? {} : { actions: layout.action }),
    tabs: {
        label: props.props.page.tabs,
        kind: "views",
        labelVisibility: "always",
        items: lesson.tabs.map((tab) => {
            const mark = markOf(tab, props)
            return {
                id: tab.id,
                label: tab.label,
                ...(tab.count === undefined ? {} : { count: tab.count }),
                ...(mark === undefined ? {} : { leading: mark }),
            }
        }),
        selectedKey: lesson.part,
        onSelect: (key) => {
            const tab = lesson.tabs.find((each) => each.id === key)
            if (tab !== undefined) props.on.openPart(tab.id)
        },
    },
})

/**
 * One lesson in four parts, the page tabs of its band (`?part=`): essence (the five-question opener, the article), Source,
 * Kịch bản and Tự áp dụng. Each part hands the shell a body, an optional right column and the one primary the band carries; a part
 * the reader's plan lacks is the locked notice (the back end names the locked parts and never sends their payload).
 */
export const EssentialLessonBase = (props: EssentialLessonBaseProps) => {
    const { slot, placeholder, slotLabels } = props.props
    const lesson = lessonOfSlot(slot, placeholder)
    const isLoading = "isLoading" in slot
    const layout = lesson === undefined ? undefined : layoutOf({ lesson, screen: props, isLoading })
    const hasAside = layout?.aside !== undefined
    return (
        <Page
            chrome="panes"
            layout="workspace"
            isLoading={isLoading}
            {...(lesson === undefined || layout === undefined ? {} : { header: bandOf(lesson, layout, props) })}
        >
            <PaneGrid
                label={props.props.page.pageTitle}
                areas={hasAside ? { base: ["main"], wide: ["main aside"] } : { base: ["main"] }}
                columns={hasAside ? { base: ["fill"], wide: ["fill", "standard"] } : { base: ["fill"] }}
                rows={{ base: ["fill"] }}
            >
                <Pane area="main">
                    <PaneSection gap="section">
                        <SlotView
                            slot={slot}
                            placeholder={placeholder}
                            labels={slotLabels}
                            forbiddenAction={
                                <Button intent="commit" href={props.props.plansHref}>
                                    {props.props.shell.upgrade}
                                </Button>
                            }
                            onRetry={props.on.retry}
                            render={(each, loading) =>
                                layoutOf({ lesson: each, screen: props, isLoading: loading }).main
                            }
                        />
                    </PaneSection>
                </Pane>
                {hasAside ? (
                    <Pane area="aside" surface>
                        {layout.aside}
                    </Pane>
                ) : null}
            </PaneGrid>
        </Page>
    )
}
