import { Page, Pane, PaneGrid, PaneSection, Section, Stack, type ListRowData } from "@starci/grammar/common"
import { RichMarkdown, SlotView } from "@starci-next/ui"
import { HarnessSkeletonBlock, HarnessSkeletonList } from "../HarnessSkeleton"
import type { HarnessDocNavItem, HarnessDocPageView, HarnessDocScreen } from "@/hooks/harnessDocs"

/** Props for {@link HarnessDocBase}: the resolved screen of one article. */
export type HarnessDocBaseProps = {
    readonly props: HarnessDocScreen["props"]
    readonly on: HarnessDocScreen["on"]
}

/** What a region of the article page is given: the article as drawn, whether it is the loading drawing, and the shared screen. */
type RegionProps = {
    readonly view: HarnessDocPageView
    readonly doc: HarnessDocBaseProps
    readonly isLoading: boolean
}

/** The body of the article: one anchored section per second-level heading, its markdown with tables, code and diagrams. */
const DocBody = (props: RegionProps) =>
    props.isLoading ? (
        <Stack gap="region">
            <HarnessSkeletonBlock lines={6} />
            <HarnessSkeletonBlock lines={8} />
            <HarnessSkeletonBlock lines={5} />
        </Stack>
    ) : (
        <Stack gap="region">
            {props.view.sections.map((section) => (
                <Section key={section.id} id={section.id} title={section.title} headingLevel={2}>
                    <RichMarkdown source={section.markdown} labels={props.doc.props.common.markdown} />
                </Section>
            ))}
        </Stack>
    )

/** One article of the list as a row; the one on screen is marked. */
const navRowOf = (doc: HarnessDocNavItem): ListRowData => ({
    id: doc.id,
    title: doc.title,
    href: doc.href,
    ...(doc.isCurrent ? { state: "informative" as const } : {}),
})

/**
 * Draws one article of part 3 as three panes of one read: the list of articles, the long markdown in anchored sections with its
 * diagrams, and the outline of this article. One SlotView feeds the body and the aside, so a failure draws one notice.
 */
export const HarnessDocBase = (props: HarnessDocBaseProps) => (
    <SlotView
        slot={props.props.slot}
        placeholder={props.props.placeholder}
        labels={props.props.slotLabels}
        onRetry={props.on.retry}
        render={(view, isLoading) => <DocBody view={view} doc={props} isLoading={isLoading} />}
        aside={(view, isLoading) =>
            isLoading ? (
                <HarnessSkeletonList rows={4} />
            ) : (
                <Section
                    kind="list"
                    title={props.props.labels.outlineTitle}
                    headingLevel={2}
                    items={view.outline.map((entry, index) => ({
                        id: entry.id,
                        title: entry.label,
                        leading: { position: index + 1 },
                        href: entry.href,
                    }))}
                    empty={props.props.labels.outlineEmpty}
                />
            )
        }
        asideFallback={null}
        frame={({ body, aside, isLoading }) => (
            <Page chrome="panes" layout="workspace" header={props.props.header}>
                <PaneGrid
                    label={props.props.labels.outlineTitle}
                    areas={{ base: ["main", "aside", "nav"], wide: ["nav main aside"] }}
                    columns={{ base: ["fill"], wide: ["standard", "fill", "standard"] }}
                    rows={{ base: ["auto", "fill", "auto"], wide: ["fill"] }}
                >
                    <Pane area="nav" scroll label={props.props.labels.navTitle}>
                        <PaneSection>
                            {isLoading ? (
                                <HarnessSkeletonList rows={4} />
                            ) : (
                                <Section
                                    kind="list"
                                    title={props.props.labels.navTitle}
                                    headingLevel={2}
                                    items={props.props.docs.map(navRowOf)}
                                    empty={props.props.labels.navEmpty}
                                />
                            )}
                        </PaneSection>
                    </Pane>
                    <Pane area="main" scroll label={props.props.labels.outlineTitle}>
                        <PaneSection>{body}</PaneSection>
                    </Pane>
                    <Pane area="aside" scroll label={props.props.labels.outlineTitle}>
                        <PaneSection>{aside}</PaneSection>
                    </Pane>
                </PaneGrid>
            </Page>
        )}
    />
)
