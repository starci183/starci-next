import {
    Button,
    EmptyNotice,
    Grid,
    Meter,
    Page,
    SearchField,
    Section,
    Stack,
    Tabs,
    Text,
    type ListRowData,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { PracticeCatalogScreen, PracticePatternItemView } from "@/hooks/practice"

/** Props for {@link PracticeCatalogBase}: the resolved screen of the catalog. */
export type PracticeCatalogBaseProps = {
    readonly props: PracticeCatalogScreen["props"]
    readonly on: PracticeCatalogScreen["on"]
}

/** What a piece of the screen needs: the resolved screen and whether the list is a skeleton. */
type PieceProps = {
    readonly screen: PracticeCatalogBaseProps
    readonly isLoading: boolean
}

/** One pattern as a row: the number, the name, where the learner stands, a thin meter, and the whole row is the link. */
const rowOf = (item: PracticePatternItemView, isLoading: boolean): ListRowData => ({
    id: item.id,
    title: item.title,
    description: item.description,
    leading: { position: item.position },
    href: item.href,
    detail: <Meter label={item.description} isLabelHidden size="sm" value={item.percent} isLoading={isLoading} />,
})

/** The primary command of the header: the problem to do next, or a retry when the read failed. */
const HeaderAction = (props: {
    readonly action: NonNullable<PracticeCatalogBaseProps["props"]["header"]["action"]>
}) =>
    "href" in props.action ? (
        <Button intent="commit" href={props.action.href}>
            {props.action.label}
        </Button>
    ) : null

/** The first-visit lead: the way in, before the list. */
const FirstVisit = (props: { readonly title: string; readonly text: string }) => (
    <Section title={props.title} headingLevel={2}>
        <Text tone="muted">{props.text}</Text>
    </Section>
)

/** The list of patterns with its search and state chips; a filter that keeps none says so and clears itself. */
const PatternList = (props: PieceProps & { readonly rows: ReadonlyArray<PracticePatternItemView> }) => {
    const { labels, query, filter, filterOptions } = props.screen.props
    const { on } = props.screen
    return (
        <Section
            kind="list"
            title={labels.listTitle}
            headingLevel={2}
            count={props.rows.length}
            caption={labels.listCaption}
            isLoading={props.isLoading}
            filter={
                <>
                    <SearchField
                        label={labels.searchLabel}
                        isLabelHidden
                        placeholder={labels.searchPlaceholder}
                        value={query}
                        onValueChange={on.setQuery}
                        onClear={() => on.setQuery("")}
                        clearLabel={labels.clearFilters}
                        isLoading={props.isLoading}
                    />
                    <Tabs
                        kind="filter"
                        label={labels.filterLabel}
                        items={filterOptions.map((each) => ({ id: each.value, label: each.label, count: each.count }))}
                        selectedKey={filter}
                        onSelect={on.setFilter}
                    />
                </>
            }
            items={props.rows.map((row) => rowOf(row, props.isLoading))}
            empty={
                <EmptyNotice
                    message={labels.noMatchTitle}
                    description={labels.noMatchText}
                    actionLabel={labels.clearFilters}
                    onAction={on.clearFilters}
                    mark="none"
                    frame="frameless"
                />
            }
        />
    )
}

/** The right column: the readiness figure, the problem left unfinished and how problems are graded. */
const Rail = (props: PieceProps) => {
    const { labels, readiness, resume } = props.screen.props
    return (
        <Stack gap="region">
            <Section title={labels.readinessTitle} headingLevel={2} isLoading={props.isLoading}>
                <Stack gap="row">
                    <Text size="figure" isStrong tabular>
                        {`${readiness.accepted}`}
                    </Text>
                    <Text>{labels.readinessUnit}</Text>
                    <Text tone="muted">{labels.readinessText}</Text>
                </Stack>
            </Section>
            {resume === null ? null : (
                <Section
                    kind="list"
                    title={labels.resumeTitle}
                    headingLevel={2}
                    isLoading={props.isLoading}
                    items={[
                        {
                            id: "resume",
                            title: resume.title,
                            description: resume.description,
                            action: { label: labels.resumeAction, href: resume.href, endArrow: true },
                            actionPlacement: "below",
                        },
                    ]}
                    empty={resume.title}
                />
            )}
            <Section title={labels.gradingTitle} headingLevel={2} isLoading={props.isLoading}>
                <Stack gap="row">
                    {labels.grading.map((line) => (
                        <Text key={line} tone="muted">
                            {line}
                        </Text>
                    ))}
                </Stack>
            </Section>
        </Stack>
    )
}

/**
 * Draws Practice code: the header with the one primary command (the next problem), the list of patterns with search and state chips,
 * and beside it the readiness figure, the unfinished problem and how grading works. Free for everyone, so nothing is locked.
 */
export const PracticeCatalogBase = (props: PracticeCatalogBaseProps) => {
    const { header, labels, isFirstVisit } = props.props
    return (
        <Page
            isLoading={"isLoading" in props.props.slot}
            header={{
                title: header.title,
                titleScale: "standard",
                breadcrumbs: "root",
                meta: header.meta,
                ...(header.action === null ? {} : { actions: <HeaderAction action={header.action} /> }),
            }}
        >
            <SlotView
                slot={props.props.slot}
                placeholder={props.props.placeholder}
                labels={props.props.slotLabels}
                errorDescription={props.props.errorDescription}
                onRetry={props.on.retry}
                render={(rows, isLoading) => (
                    <Grid
                        kind="main-rail"
                        primary={
                            <Stack gap="region">
                                {isFirstVisit ? <FirstVisit title={labels.firstTitle} text={labels.firstText} /> : null}
                                <PatternList screen={props} isLoading={isLoading} rows={rows} />
                            </Stack>
                        }
                        rail={<Rail screen={props} isLoading={isLoading} />}
                    />
                )}
            />
        </Page>
    )
}
