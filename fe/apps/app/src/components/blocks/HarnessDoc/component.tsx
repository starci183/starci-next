import { Markdown, Page, Pane, PaneGrid, PaneSection, Section, Stack } from "@starci/grammar/common"
import { OutlineList, SlotView } from "@starci-next/ui"
import type { HarnessDocPageView, HarnessDocScreen } from "@/hooks/harnessDocs"

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
const DocBody = (props: RegionProps) => (
    <Stack gap="region">
        {props.view.sections.map((section) => (
            <Section
                key={section.id}
                id={section.id}
                title={section.title}
                headingLevel={2}
                isLoading={props.isLoading}
            >
                <Markdown source={section.markdown} labels={props.doc.props.common.markdown} />
            </Section>
        ))}
    </Stack>
)

/** Draws one article of part 3: long markdown in anchored sections with its diagrams, and the outline beside it. */
export const HarnessDocBase = (props: HarnessDocBaseProps) => (
    <Page chrome="panes" layout="workspace" header={props.props.header}>
        <PaneGrid
            label={props.props.labels.outlineTitle}
            areas={{ base: ["aside", "main"], wide: ["main aside"] }}
            columns={{ base: ["fill"], wide: ["fill", "standard"] }}
            rows={{ base: ["auto", "fill"], wide: ["fill"] }}
        >
            <Pane area="main" scroll label={props.props.labels.outlineTitle}>
                <PaneSection>
                    <SlotView
                        slot={props.props.slot}
                        placeholder={props.props.placeholder}
                        labels={props.props.slotLabels}
                        onRetry={props.on.retry}
                        render={(view, isLoading) => <DocBody view={view} doc={props} isLoading={isLoading} />}
                    />
                </PaneSection>
            </Pane>
            <Pane area="aside" surface scroll label={props.props.labels.outlineTitle}>
                <PaneSection>
                    <SlotView
                        slot={props.props.slot}
                        placeholder={props.props.placeholder}
                        labels={props.props.slotLabels}
                        onRetry={props.on.retry}
                        render={(view, isLoading) => (
                            <OutlineList
                                label={props.props.labels.outlineTitle}
                                emptyLabel={props.props.labels.outlineEmpty}
                                entries={view.outline}
                                isLoading={isLoading}
                            />
                        )}
                    />
                </PaneSection>
            </Pane>
        </PaneGrid>
    </Page>
)
