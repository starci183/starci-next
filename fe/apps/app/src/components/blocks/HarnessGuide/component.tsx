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
import { OutlineList, RichMarkdown, SlotView } from "@starci-next/ui"
import type {
    HarnessDoctorPanelView,
    HarnessGuidePageView,
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
                title={section.title}
                headingLevel={2}
                isLoading={props.isLoading}
            >
                <RichMarkdown source={section.markdown} labels={props.guide.props.common.markdown} />
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
            <OutlineList
                label={labels.outlineTitle}
                emptyLabel={labels.outlineEmpty}
                entries={props.view.outline}
                isLoading={props.isLoading}
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
                    kind="compact"
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

/**
 * Draws one guide of part 2: its markdown in anchored sections with copy buttons, and beside it the outline, the tool switch and the
 * `harness doctor` panel. Each region reads and fails on its own.
 */
export const HarnessGuideBase = (props: HarnessGuideBaseProps) => (
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
                        slot={props.props.guide}
                        placeholder={props.props.guidePlaceholder}
                        labels={props.props.slotLabels}
                        onRetry={props.on.retryGuide}
                        render={(view, isLoading) => <GuideBody view={view} guide={props} isLoading={isLoading} />}
                    />
                </PaneSection>
            </Pane>
            <Pane area="aside" surface scroll label={props.props.labels.doctorTitle}>
                <PaneSection>
                    <Stack gap="region">
                        <SlotView
                            slot={props.props.guide}
                            placeholder={props.props.guidePlaceholder}
                            labels={props.props.slotLabels}
                            onRetry={props.on.retryGuide}
                            render={(view, isLoading) => (
                                <OutlineAside view={view} guide={props} isLoading={isLoading} />
                            )}
                        />
                        <SlotView
                            slot={props.props.doctor}
                            placeholder={props.props.doctorPlaceholder}
                            labels={props.props.slotLabels}
                            onRetry={props.on.retryDoctor}
                            render={(view, isLoading) => (
                                <DoctorAside view={view} guide={props} isLoading={isLoading} />
                            )}
                        />
                    </Stack>
                </PaneSection>
            </Pane>
        </PaneGrid>
    </Page>
)
