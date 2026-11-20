import {
    ChoiceChips,
    CopyField,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    Section,
    Stack,
    Switch,
    type ListRowData,
} from "@starci/grammar/common"
import { RichMarkdown, SlotView } from "@starci-next/ui"
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
}) => (
    <Stack gap="region">
        {props.view.sections.map((section) => (
            <Section
                key={section.id}
                id={section.id}
                {...(props.isLoading
                    ? { ariaLabel: props.guide.props.labels.outlineTitle }
                    : { title: section.title, headingLevel: 2 as const })}
                isLoading={props.isLoading}
            >
                <RichMarkdown
                    source={section.markdown}
                    labels={props.guide.props.common.markdown}
                    isLoading={props.isLoading}
                />
            </Section>
        ))}
    </Stack>
)

/** The outline of the guide and the tool switch that moves to the same guide of the other tool. */
const OutlineAside = (props: {
    readonly view: HarnessGuidePageView
    readonly guide: HarnessGuideBaseProps
    readonly isLoading: boolean
}) => {
    const { labels, common, toolOptions } = props.guide.props
    return (
        <Stack gap="region">
            <Section
                kind="list"
                title={labels.outlineTitle}
                headingLevel={2}
                isLoading={props.isLoading}
                items={props.view.outline.map((entry, index) => ({
                    id: entry.id,
                    title: entry.label,
                    leading: { position: index + 1 },
                    href: entry.href,
                }))}
                empty={labels.outlineEmpty}
            />
            <Section title={common.toolLabel} headingLevel={2} caption={labels.toolDescription}>
                <ChoiceChips
                    label={common.toolLabel}
                    isLabelHidden
                    options={toolOptions}
                    value={props.view.tool}
                    onValueChange={props.guide.on.chooseTool}
                    empty={labels.outlineEmpty}
                />
            </Section>
        </Stack>
    )
}

/** The `harness doctor` result of the guide's tool: the command, when the result arrived and the probes this guide fixes. */
const DoctorAside = (props: {
    readonly view: HarnessDoctorPanelView
    readonly guide: HarnessGuideBaseProps
    readonly isLoading: boolean
}) => {
    const { labels, common, isOnlyFailing } = props.guide.props
    return (
        <Section
            title={labels.doctorTitle}
            headingLevel={2}
            fact={props.view.summary}
            meta={props.view.ranAt}
            isLoading={props.isLoading}
        >
            <Stack gap="row">
                <CopyField
                    label={labels.doctorCommandLabel}
                    description={labels.doctorCommandDescription}
                    value={props.view.command}
                    copyLabel={common.copy.copy}
                    copiedLabel={common.copy.copied}
                    copyErrorLabel={common.copy.copyError}
                    isLoading={props.isLoading}
                />
                <Switch
                    label={labels.doctorOnlyFailingLabel}
                    description={labels.doctorOnlyFailingDescription}
                    isSelected={isOnlyFailing}
                    onSelectedChange={props.guide.on.setOnlyFailing}
                    isLoading={props.isLoading}
                />
                <Section
                    kind="list"
                    ariaLabel={labels.doctorTitle}
                    isLoading={props.isLoading}
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
        aside={(view, isLoading) => (
            <Stack gap="region">
                <OutlineAside view={view} guide={props} isLoading={isLoading} />
                <DoctorAside view={view.doctor} guide={props} isLoading={isLoading} />
            </Stack>
        )}
        asideFallback={null}
        frame={({ body, aside, isLoading }) => (
            <Page chrome="panes" layout="workspace" header={props.props.header}>
                <PaneGrid
                    label={props.props.labels.outlineTitle}
                    areas={{ base: ["nav", "main", "aside"], wide: ["nav main aside"] }}
                    columns={{ base: ["fill"], wide: ["standard", "fill", "standard"] }}
                    rows={{ base: ["auto", "fill", "auto"], wide: ["fill"] }}
                >
                    <Pane area="nav" scroll label={props.props.labels.navTitle}>
                        <PaneSection>
                            <Section
                                kind="list"
                                title={props.props.labels.navTitle}
                                headingLevel={2}
                                isLoading={isLoading}
                                items={props.props.guides.map(navRowOf)}
                                empty={props.props.labels.navEmpty}
                            />
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
