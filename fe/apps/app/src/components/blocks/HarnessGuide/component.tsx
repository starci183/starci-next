import {
    CopyField,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Select,
    Stack,
    Switch,
    type ListRowData,
} from "@starci/grammar/common"
import { RichMarkdown, SlotView } from "@starci-next/ui"
import { HarnessSkeletonBlock, HarnessSkeletonList } from "../HarnessSkeleton"
import type {
    HarnessDoctorPanelView,
    HarnessGuidePageView,
    HarnessGuideNavItem,
    HarnessGuideScreen,
    HarnessProbeItemView,
} from "@/hooks/harnessUse"

/** Props for {@link HarnessGuideBase}: the resolved screen of one guide. */
export type HarnessGuideBaseProps = {
    readonly props: HarnessGuideScreen["props"]
    readonly on: HarnessGuideScreen["on"]
}

/** One probe as a row, with the guide that fixes it when it fails. */
const probeRowOf = (probe: HarnessProbeItemView): ListRowData => ({
    id: probe.id,
    title: probe.title,
    ...(probe.detail === "" ? {} : { description: probe.detail }),
    badges: [{ label: probe.outcome, tone: probe.tone, isDot: true }],
    ...(probe.fixHref === "" ? {} : { action: { label: probe.fixLabel, href: probe.fixHref } }),
})

/** The body of the guide: one anchored section per second-level heading, its markdown with copy buttons on every code block. */
const GuideBody = (props: {
    readonly view: HarnessGuidePageView
    readonly guide: HarnessGuideBaseProps
    readonly isLoading: boolean
}) =>
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
                    <RichMarkdown source={section.markdown} labels={props.guide.props.common.markdown} />
                </Section>
            ))}
        </Stack>
    )

/** The outline of the guide and the tool switch that moves to the same guide of the other tool. */
const OutlineAside = (props: { readonly view: HarnessGuidePageView; readonly guide: HarnessGuideBaseProps }) => {
    const { labels, common, toolOptions } = props.guide.props
    return (
        <Stack gap="region">
            <Section
                kind="list"
                title={labels.outlineTitle}
                headingLevel={2}
                items={props.view.outline.map((entry, index) => ({
                    id: entry.id,
                    title: entry.label,
                    leading: { position: index + 1 },
                    href: entry.href,
                }))}
                empty={labels.outlineEmpty}
            />
            <Section title={common.toolLabel} headingLevel={2} caption={labels.toolDescription}>
                <Select
                    label={common.toolLabel}
                    isLabelHidden
                    appearance="compact"
                    options={toolOptions}
                    value={props.view.tool}
                    onValueChange={(tool) => {
                        if (tool !== null) props.guide.on.chooseTool(tool)
                    }}
                />
            </Section>
        </Stack>
    )
}

/** The `harness doctor` result of the guide's tool: the command, when the result arrived and the probes this guide fixes. */
const DoctorAside = (props: { readonly view: HarnessDoctorPanelView; readonly guide: HarnessGuideBaseProps }) => {
    const { labels, common, isOnlyFailing } = props.guide.props
    return (
        <Section title={labels.doctorTitle} headingLevel={2} fact={props.view.summary} meta={props.view.ranAt}>
            <Stack gap="row">
                <CopyField
                    label={labels.doctorCommandLabel}
                    description={labels.doctorCommandDescription}
                    value={props.view.command}
                    copyLabel={common.copy.copy}
                    copiedLabel={common.copy.copied}
                    copyErrorLabel={common.copy.copyError}
                />
                <Switch
                    label={labels.doctorOnlyFailingLabel}
                    description={labels.doctorOnlyFailingDescription}
                    isSelected={isOnlyFailing}
                    onSelectedChange={props.guide.on.setOnlyFailing}
                />
                <Section
                    kind="list"
                    ariaLabel={labels.doctorTitle}
                    items={props.view.probes.filter((probe) => !isOnlyFailing || probe.isFailing).map(probeRowOf)}
                    empty={labels.doctorEmpty}
                />
            </Stack>
        </Section>
    )
}

/** One guide of the list as a row; the one on screen is marked. */
const navRowOf = (guide: HarnessGuideNavItem): ListRowData => ({
    id: guide.id,
    title: guide.title,
    href: guide.href,
    ...(guide.isCurrent ? { state: "informative" as const } : {}),
})

/**
 * Draws one guide of part 2 as three panes of one read: the guides of the tool, the markdown in anchored sections, and the outline
 * with the tool pick and the harness doctor panel. One SlotView feeds the body and the aside, so a failure draws one notice.
 */
export const HarnessGuideBase = (props: HarnessGuideBaseProps) => (
    <SlotView
        slot={props.props.guide}
        placeholder={props.props.guidePlaceholder}
        labels={props.props.slotLabels}
        onRetry={props.on.retryGuide}
        render={(view, isLoading) => <GuideBody view={view} guide={props} isLoading={isLoading} />}
        aside={(view, isLoading) =>
            isLoading ? (
                <Stack gap="region">
                    <HarnessSkeletonList rows={4} />
                    <HarnessSkeletonBlock lines={5} />
                </Stack>
            ) : (
                <Stack gap="region">
                    <OutlineAside view={view} guide={props} />
                    <DoctorAside view={view.doctor} guide={props} />
                </Stack>
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
                                    items={props.props.guides.map(navRowOf)}
                                    empty={props.props.labels.navEmpty}
                                />
                            )}
                        </PaneSection>
                    </Pane>
                    <Pane area="main" scroll label={props.props.labels.outlineTitle}>
                        <PaneSection>{body}</PaneSection>
                    </Pane>
                    <Pane area="aside" scroll label={props.props.labels.doctorTitle}>
                        <PaneSection>{aside}</PaneSection>
                    </Pane>
                </PaneGrid>
            </Page>
        )}
    />
)
