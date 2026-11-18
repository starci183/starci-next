import type { ReactNode } from "react"
import {
    Badge,
    ChoiceChips,
    CopyField,
    DataTable,
    Page,
    Section,
    Stack,
    Switch,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type {
    HarnessDoctorPanelView,
    HarnessGuideItemView,
    HarnessProbeItemView,
    HarnessTrialItemView,
    HarnessUseScreen,
} from "@/hooks/harnessUse"

/** Props for {@link HarnessUseBase}: the resolved screen of part 2. */
export type HarnessUseBaseProps = {
    readonly props: HarnessUseScreen["props"]
    readonly on: HarnessUseScreen["on"]
}

/** What a region of part 2 is given: its read as drawn, whether it is the loading drawing, and the shared screen. */
type RegionProps<View> = {
    readonly view: View
    readonly isLoading: boolean
    readonly screen: HarnessUseBaseProps
}

/** One guide as a row: its title and summary. */
const guideRowOf = (guide: HarnessGuideItemView): ListRowData => ({
    id: guide.slug,
    title: guide.title,
    description: guide.summary,
    href: guide.href,
})

/** One probe as a row: what it checked and what it found, its outcome as a chip and, when it fails, the guide that fixes it. */
const probeRowOf = (probe: HarnessProbeItemView): ListRowData => ({
    id: probe.id,
    title: probe.title,
    ...(probe.detail === "" ? {} : { description: probe.detail }),
    badges: [{ label: probe.outcome, tone: probe.tone, isDot: true }],
    ...(probe.fixHref === "" ? {} : { action: { label: probe.fixLabel, href: probe.fixHref } }),
})

/** A table row: its id and the cell of each column by column id. */
type CellsRow = { readonly id: string; readonly cells: Readonly<Record<string, ReactNode>> }

/** One trap as a table row: the shortcuts the headless run observed, the verdict and the cost the CLI estimated. */
const trialRowOf = (trial: HarnessTrialItemView): CellsRow => ({
    id: trial.id,
    cells: {
        trap: (
            <Stack gap="identity">
                <Text isStrong>{trial.title}</Text>
                <Text size="sm" tone="muted">
                    {trial.summary}
                </Text>
            </Stack>
        ),
        shortcuts: <Text>{trial.shortcuts}</Text>,
        verdict: <Badge tone={trial.tone}>{trial.verdict}</Badge>,
        cost: <Text tone="muted">{trial.cost}</Text>,
    },
})

/** The guides of the tool the learner picked, as one flat list. */
const GuidesRegion = (props: RegionProps<ReadonlyArray<HarnessGuideItemView>>) => (
    <Section
        kind="list"
        title={props.screen.props.labels.guidesTitle}
        headingLevel={2}
        count={props.view.length}
        isLoading={props.isLoading}
        items={props.view.map((guide) => guideRowOf(guide))}
        empty={props.screen.props.labels.guidesEmpty}
    />
)

/** The `harness doctor` panel: the command that produces the result, when it last arrived and one row per probe. */
const DoctorRegion = (props: RegionProps<HarnessDoctorPanelView>) => {
    const { labels, common, isOnlyFailing } = props.screen.props
    const { view } = props
    return (
        <Section
            title={labels.doctorTitle}
            headingLevel={2}
            fact={view.summary}
            meta={view.ranAt}
            isLoading={props.isLoading}
        >
            <Stack gap="row">
                <CopyField
                    label={labels.doctorCommandLabel}
                    description={labels.doctorCommandDescription}
                    value={view.command}
                    copyLabel={common.copy.copy}
                    copiedLabel={common.copy.copied}
                    copyErrorLabel={common.copy.copyError}
                    isLoading={props.isLoading}
                />
                <Switch
                    kind="compact"
                    label={labels.onlyFailingLabel}
                    description={labels.onlyFailingDescription}
                    isSelected={isOnlyFailing}
                    onSelectedChange={props.screen.on.setOnlyFailing}
                    isLoading={props.isLoading}
                />
                <Section
                    kind="list"
                    ariaLabel={labels.doctorTitle}
                    isLoading={props.isLoading}
                    items={view.probes
                        .filter((probe) => !isOnlyFailing || probe.isFailing)
                        .map((probe) => probeRowOf(probe))}
                    empty={labels.doctorEmpty}
                />
            </Stack>
        </Section>
    )
}

/** The trial panel: per trap, the shortcuts the headless run observed and the verdict. */
const TrialsRegion = (props: RegionProps<ReadonlyArray<HarnessTrialItemView>>) => {
    const { labels } = props.screen.props
    return (
        <Section
            title={labels.trialsTitle}
            headingLevel={2}
            count={props.view.length}
            isLoading={props.isLoading}
            caption={labels.trialCommand}
        >
            <DataTable
                label={labels.trialsTitle}
                isLoading={props.isLoading}
                columns={[
                    { id: "trap", label: labels.trapColumn },
                    { id: "shortcuts", label: labels.shortcutsColumn, hideBelow: "tablet" },
                    { id: "verdict", label: labels.verdictColumn, width: "fit" },
                    { id: "cost", label: labels.costColumn, width: "fit", hideBelow: "tablet" },
                ]}
                rows={props.view.map((trial) => trialRowOf(trial))}
                renderCell={(row, columnId) => row.cells[columnId]}
                emptyContent={<Text tone="muted">{labels.trialsEmpty}</Text>}
            />
        </Section>
    )
}

/**
 * Draws part 2: the tool picker, the guides of that tool as one flat list, the `harness doctor` panel with a row per local probe,
 * and the trial panel with the shortcuts each trap saw and its verdict. The tool is remembered per learner; each read fails alone.
 */
export const HarnessUseBase = (props: HarnessUseBaseProps) => (
    <Page header={props.props.header}>
        <Stack gap="region">
            <Section title={props.props.common.toolLabel} headingLevel={2} caption={props.props.labels.toolDescription}>
                <ChoiceChips
                    label={props.props.common.toolLabel}
                    isLabelHidden
                    options={props.props.toolOptions}
                    value={props.props.tool}
                    onValueChange={props.on.chooseTool}
                    empty={props.props.labels.guidesEmpty}
                />
            </Section>
            <SlotView
                slot={props.props.guides}
                placeholder={props.props.guidesPlaceholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retryGuides}
                render={(view, isLoading) => <GuidesRegion view={view} isLoading={isLoading} screen={props} />}
            />
            <SlotView
                slot={props.props.doctor}
                placeholder={props.props.doctorPlaceholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retryDoctor}
                render={(view, isLoading) => <DoctorRegion view={view} isLoading={isLoading} screen={props} />}
            />
            <SlotView
                slot={props.props.trials}
                placeholder={props.props.trialsPlaceholder}
                labels={props.props.slotLabels}
                onRetry={props.on.retryTrials}
                render={(view, isLoading) => <TrialsRegion view={view} isLoading={isLoading} screen={props} />}
            />
        </Stack>
    </Page>
)
