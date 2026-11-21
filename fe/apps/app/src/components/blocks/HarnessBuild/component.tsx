import { Skeleton } from "@heroui/react"
import type { ReactNode } from "react"
import {
    Alert,
    Badge,
    Button,
    CopyField,
    DataTable,
    DisclosureList,
    Input,
    Page,
    Section,
    Stack,
    Switch,
    Terminal,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { RichMarkdown, SlotView } from "@starci-next/ui"
import { HarnessSkeletonBlock, HarnessSkeletonList } from "../HarnessSkeleton"
import type {
    HarnessBuildScreen,
    HarnessBuildScreenView,
    HarnessCaseItemView,
    HarnessStageItemView,
} from "@/hooks/harnessBuild"

/** Props for {@link HarnessBuildBase}: the resolved screen of one build. */
export type HarnessBuildBaseProps = {
    readonly props: HarnessBuildScreen["props"]
    readonly on: HarnessBuildScreen["on"]
}

/** What a region of the build page is given: the build as drawn, whether it is the loading drawing, and the shared screen. */
type RegionProps = {
    readonly view: HarnessBuildScreenView
    readonly isLoading: boolean
    readonly screen: HarnessBuildBaseProps
}

/** One stage as a row of the list beside the page: its title and summary, the e2e count as its meta and its outcome as a chip. */
const stageRowOf = (stage: HarnessStageItemView): ListRowData => ({
    id: stage.id,
    title: stage.title,
    description: stage.summary,
    badges: [{ label: stage.outcome, tone: stage.tone }],
    meta: { text: stage.count },
    href: stage.href,
    ...(stage.isSelected ? { state: "informative" as const } : {}),
})

/** A table row: its id and the cell of each column by column id. */
type CellsRow = { readonly id: string; readonly cells: Readonly<Record<string, ReactNode>> }

/** One e2e case as a table row: its title, its outcome chip and why it failed. */
const caseRowOf = (each: HarnessCaseItemView): CellsRow => ({
    id: each.id,
    cells: {
        case: <Text>{each.title}</Text>,
        outcome: <Badge tone={each.tone}>{each.outcome}</Badge>,
        detail: <Text tone="muted">{each.detail}</Text>,
    },
})

/** The e2e cases of the stage on screen, with the switch that hides the green ones. */
const CasesRegion = (props: RegionProps) => {
    const { labels, isOnlyOpen } = props.screen.props
    const cases = props.view.selected.cases.filter((each) => !isOnlyOpen || each.isOpen)
    return (
        <Section
            title={labels.casesTitle}
            headingLevel={2}
            count={props.view.selected.cases.length}
            fact={props.view.selected.count}
            isLoading={props.isLoading}
        >
            <Stack gap="row">
                <Switch
                    label={labels.onlyOpenLabel}
                    description={labels.onlyOpenDescription}
                    isSelected={isOnlyOpen}
                    onSelectedChange={props.screen.on.setOnlyOpen}
                    isLoading={props.isLoading}
                />
                <DataTable
                    label={labels.casesTitle}
                    isLoading={props.isLoading}
                    columns={[
                        { id: "case", label: labels.caseColumn },
                        { id: "outcome", label: labels.outcomeColumn, width: "fit" },
                        { id: "detail", label: labels.detailColumn, hideBelow: "tablet" },
                    ]}
                    rows={cases.map(caseRowOf)}
                    renderCell={(row, columnId) => row.cells[columnId]}
                    emptyContent={<Text tone="muted">{labels.casesEmpty}</Text>}
                />
            </Stack>
        </Section>
    )
}

/** The newest run of the stage as the learner's terminal printed it, then the step guide that takes the stage to green. */
/** The steps of a stage drawn in full, as the canvas draws them: the first few, then the others one row each, closed. */
const STEPS_IN_FULL = 3

const GuideRegion = (props: RegionProps) => {
    const { labels, common } = props.screen.props
    const { selected } = props.view
    return (
        <Stack gap="region">
            <Terminal title={labels.logTitle} lines={selected.log} isLoading={props.isLoading} />
            <Section
                title={labels.stepsTitle}
                headingLevel={2}
                count={selected.steps.length}
                isLoading={props.isLoading}
            >
                {selected.isLocked ? (
                    <Alert tone="informative" title={labels.lockedTitle} description={labels.lockedText} />
                ) : (
                    <Stack gap="section">
                        {(props.isLoading ? selected.steps : selected.steps.slice(0, STEPS_IN_FULL)).map(
                            (step, index) => (
                                <Section
                                    key={step.id}
                                    {...(props.isLoading
                                        ? { ariaLabel: labels.stepsTitle }
                                        : { title: `${index + 1}. ${step.title}`, headingLevel: 3 as const })}
                                    isLoading={props.isLoading}
                                >
                                    <RichMarkdown
                                        source={step.markdown}
                                        labels={common.markdown}
                                        isLoading={props.isLoading}
                                    />
                                </Section>
                            ),
                        )}
                        {props.isLoading || selected.steps.length <= STEPS_IN_FULL ? null : (
                            <DisclosureList
                                label={labels.moreStepsLabel(selected.steps.length - STEPS_IN_FULL)}
                                items={selected.steps.slice(STEPS_IN_FULL).map((step, index) => ({
                                    id: step.id,
                                    title: `${index + STEPS_IN_FULL + 1}. ${step.title}`,
                                    body: <RichMarkdown source={step.markdown} labels={common.markdown} />,
                                }))}
                            />
                        )}
                    </Stack>
                )}
            </Section>
        </Stack>
    )
}

/** The repository that proves the build: its status, then the repository and the audience when bound, else the field that binds one. */
const RepoRegion = (props: RegionProps) => {
    const { labels, common, repository, isBinding, isBindFailed } = props.screen.props
    const { repository: bound } = props.view
    return (
        <Section
            title={labels.repoTitle}
            headingLevel={2}
            fact={bound.isBound ? labels.repoBound : labels.repoUnbound}
            caption={labels.repoText}
            isLoading={props.isLoading}
        >
            <Stack gap="row">
                <Text tone="muted" isLoading={props.isLoading}>
                    {labels.keysLabel}: {props.view.keys}
                </Text>
                {bound.isBound ? (
                    <>
                        <Text isStrong>{bound.name}</Text>
                        <CopyField
                            label={labels.repoAudienceLabel}
                            description={labels.repoAudienceDescription}
                            value={bound.audience}
                            copyLabel={common.copy.copy}
                            copiedLabel={common.copy.copied}
                            copyErrorLabel={common.copy.copyError}
                        />
                    </>
                ) : (
                    <>
                        <Input
                            id="harness-repository"
                            name="repository"
                            label={labels.repoField}
                            placeholder={labels.repoPlaceholder}
                            value={repository}
                            onValueChange={props.screen.on.changeRepository}
                            isInvalid={isBindFailed}
                            {...(isBindFailed ? { errorMessage: labels.repoFailed } : {})}
                            isLoading={props.isLoading}
                        />
                        <Button
                            intent="neutral"
                            isPending={isBinding}
                            isDisabled={repository.trim() === ""}
                            onPress={props.screen.on.bind}
                        >
                            {labels.repoBind}
                        </Button>
                    </>
                )}
            </Stack>
        </Section>
    )
}

/** The main pane: the command that pulls the starter source, the stage on screen with its cases, its log and its step guide. */
const MainRegion = (props: RegionProps) => {
    const { labels, common } = props.screen.props
    return (
        <Stack gap="region">
            <CopyField
                label={labels.pullLabel}
                description={labels.pullDescription}
                value={props.view.pullCommand}
                copyLabel={common.copy.copy}
                copiedLabel={common.copy.copied}
                copyErrorLabel={common.copy.copyError}
                isLoading={props.isLoading}
            />
            <RepoRegion {...props} />
            {props.isLoading ? null : (
                <Section
                    title={props.view.selected.title}
                    headingLevel={2}
                    fact={props.view.selected.outcome}
                    caption={props.view.selected.summary}
                    isLoading={props.isLoading}
                >
                    <Text tone="muted" isLoading={props.isLoading}>
                        {props.view.selected.position}
                    </Text>
                </Section>
            )}
            <CasesRegion {...props} />
            <GuideRegion {...props} />
        </Stack>
    )
}

/** The build while its first read loads: bars only, in the geometry of the stages, the pull command, the repository, the cases and the guide. */
const BuildSkeleton = () => (
    <Stack gap="region">
        <HarnessSkeletonList rows={3} />
        <HarnessSkeletonBlock lines={1} />
        <HarnessSkeletonBlock lines={3} />
        <HarnessSkeletonBlock lines={2} />
        <HarnessSkeletonList rows={3} />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <HarnessSkeletonBlock lines={6} />
    </Stack>
)

/**
 * Draws one build of part 1: the stages with their e2e status (the newest result of each, live over the relay) as one flat list, then
 * the stage on screen with the command that pulls the starter source, its cases, the log of its newest run and the step guide with
 * copyable code blocks.
 */
export const HarnessBuildBase = (props: HarnessBuildBaseProps) => (
    <Page
        header={{
            ...props.props.header,
            ...(props.props.backLabel === ""
                ? {}
                : {
                      actions: (
                          <Button intent="neutral" href={props.props.backHref}>
                              {props.props.backLabel}
                          </Button>
                      ),
                  }),
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) =>
                isLoading ? (
                    <BuildSkeleton />
                ) : (
                    <Stack gap="region">
                        <Section
                            kind="list"
                            title={props.props.labels.stagesTitle}
                            headingLevel={2}
                            count={view.stages.length}
                            meta={view.ranAt}
                            isLoading={isLoading}
                            items={view.stages.map(stageRowOf)}
                            empty={props.props.labels.casesEmpty}
                        />
                        <MainRegion view={view} isLoading={isLoading} screen={props} />
                    </Stack>
                )
            }
        />
    </Page>
)
