import {
    Badge,
    Button,
    Cluster,
    EmptyNotice,
    Grid,
    Page,
    Progress,
    Section,
    Stack,
    Text,
    type ListRowData,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import { SkeletonBlock, SkeletonRows } from "../LoadingShapes"
import type { PracticePatternScreen, PracticeProblemItem } from "@/hooks/practice"

/** Props for {@link PracticePatternBase}: the resolved screen of one pattern. */
export type PracticePatternBaseProps = {
    readonly props: PracticePatternScreen["props"]
    readonly on: PracticePatternScreen["on"]
}

/** One problem as a row: its number, its name, the difficulty dot with the technique tags, the status badge; the row is the link. */
const rowOf = (item: PracticeProblemItem): ListRowData => ({
    id: item.id,
    title: item.title,
    leading: { position: item.position },
    href: item.href,
    badges: [{ label: item.status, tone: item.statusTone, isDot: true }],
    description: (
        <Cluster gap="inline" wrap align="center">
            <Badge isDot tone={item.difficultyTone}>
                {item.difficulty}
            </Badge>
            {item.tags.map((tag) => (
                <Text key={tag} size="xs" tone="muted">
                    {tag}
                </Text>
            ))}
        </Cluster>
    ),
})

/** The problems of the pattern as one flat list; a pattern with none says so and points back to the catalog. */
const ProblemList = (props: {
    readonly rows: ReadonlyArray<PracticeProblemItem>
    readonly labels: PracticePatternBaseProps["props"]["labels"]
    readonly isLoading: boolean
}) => (
    <Section
        kind="list"
        title={props.labels.listTitle}
        headingLevel={2}
        count={props.rows.length}
        isLoading={props.isLoading}
        items={props.rows.map(rowOf)}
        empty={
            <EmptyNotice
                message={props.labels.emptyTitle}
                description={props.labels.emptyText}
                actionLabel={props.labels.emptyAction}
                actionHref={props.labels.catalogHref}
                frame="frameless"
            />
        }
    />
)

/** The right column: the pattern progress and the pattern that follows. */
const Rail = (props: { readonly screen: PracticePatternBaseProps["props"]; readonly isLoading: boolean }) => {
    const { labels, progress, nextPattern } = props.screen
    return (
        <Stack gap="region">
            <Section title={labels.progressTitle} headingLevel={2} isLoading={props.isLoading}>
                <Stack gap="inline">
                    <Progress label={labels.progressLabel} value={progress.percent} valueText={progress.text} />
                    <Text tone="muted" isLoading={props.isLoading}>
                        {progress.text}
                    </Text>
                </Stack>
            </Section>
            {nextPattern === null && !props.isLoading ? null : (
                <Section
                    kind="list"
                    title={labels.nextTitle}
                    headingLevel={2}
                    isLoading={props.isLoading}
                    items={
                        nextPattern === null
                            ? []
                            : [
                                  {
                                      id: "next-pattern",
                                      title: nextPattern.title,
                                      description: nextPattern.description,
                                      leading: { position: nextPattern.position },
                                      href: nextPattern.href,
                                  },
                              ]
                    }
                    empty={nextPattern?.title ?? ""}
                />
            )}
        </Stack>
    )
}

/** The pattern while its first read loads: the intro block, the problem rows and the rail as bars, no word and no tone. */
const PatternSkeleton = () => (
    <Grid
        kind="main-rail"
        primary={
            <Stack gap="region">
                <SkeletonBlock lines={3} />
                <SkeletonRows rows={6} isMarked />
            </Stack>
        }
        rail={
            <Stack gap="region">
                <SkeletonBlock lines={2} />
                <SkeletonBlock lines={2} />
            </Stack>
        }
    />
)

/**
 * Draws one pattern: the header with the number of problems accepted and the one primary command, the short "when to use it"
 * paragraph, the problems as a flat list with where the learner stands in each, and the pattern progress beside them.
 */
export const PracticePatternBase = (props: PracticePatternBaseProps) => {
    const { header, labels, intro } = props.props
    const pageHeaderOf = (loading: boolean): PageHeaderContent => ({
        title: header.title,
        titleScale: "standard",
        meta: header.meta,
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [
                { id: "practice", label: header.crumb, href: labels.catalogHref },
                { id: "pattern", label: header.title, ...(loading ? { isLoading: true as const } : {}) },
            ],
        },
        ...(header.action === null
            ? {}
            : {
                  actions: (
                      <Button intent="commit" href={header.action.href}>
                          {header.action.label}
                      </Button>
                  ),
              }),
    })
    const fallback: PageHeaderContent = {
        title: header.title,
        titleScale: "standard",
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [{ id: "practice", label: header.crumb, href: labels.catalogHref }],
        },
    }
    return (
        <SlotView<readonly PracticeProblemItem[], PageHeaderContent>
            header={(_rows, loading) => pageHeaderOf(loading)}
            headerFallback={fallback}
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            errorDescription={props.props.errorDescription}
            onRetry={props.on.retry}
            render={(rows, isLoading) =>
                isLoading ? (
                    <PatternSkeleton />
                ) : (
                    <Grid
                        kind="main-rail"
                        primary={
                            <Stack gap="region">
                                {intro === "" ? null : (
                                    <Section title={labels.introTitle} headingLevel={2} isLoading={isLoading}>
                                        <Text as="p">{intro}</Text>
                                    </Section>
                                )}
                                <ProblemList rows={rows} labels={labels} isLoading={isLoading} />
                            </Stack>
                        }
                        rail={<Rail screen={props.props} isLoading={isLoading} />}
                    />
                )
            }
            frame={({ header, body, isLoading }) => (
                <Page isLoading={isLoading} header={header}>
                    {body}
                </Page>
            )}
        />
    )
}
