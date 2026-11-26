import { Button, DataTable, Link, Section, Stack, Text, type DataTableColumn } from "@starci/grammar/common"

/** One column of the comparison: an unhappy case the learner fixed, headed by its number and keyed by its title under the table. */
export type CourseProductionColumnView = {
    readonly id: string
    /** The head of the column: the case's number in the unhappy loop ("1", as page 4 numbers it "1."), short so the column never widens the table. */
    readonly label: string
    /** The case's full title, read in the key under the table beside its number. */
    readonly title: string
}

/** One row of the comparison: a repository (or the learner's own code) with how it handles each idea, in words, in the order of the columns. */
export type CourseProductionRowView = {
    readonly id: string
    readonly name: string
    /** The language of the repository; empty for the learner's own row. */
    readonly lang: string
    readonly cells: ReadonlyArray<{ readonly id: string; readonly text: string; readonly isMuted: boolean }>
    /** True for the learner's own row. */
    readonly isLearner: boolean
}

/** One repository read in words, with its files pinned to a commit. */
export type CourseProductionRepoView = {
    readonly id: string
    readonly name: string
    /** The language and, when the record says, the day its files were checked, in one muted line. */
    readonly meta: string
    /** How it does it and how that differs from the learner's file: a few sentences, read in full. */
    readonly note: string
    readonly files: ReadonlyArray<{ readonly path: string; readonly url: string }>
}

/** What the last half of the submit page draws once the learner's code passed. */
export type CourseProductionView = {
    readonly columns: ReadonlyArray<CourseProductionColumnView>
    readonly rows: ReadonlyArray<CourseProductionRowView>
    readonly repos: ReadonlyArray<CourseProductionRepoView>
    /** What the learner did that none of the listed repositories ships; empty when the record says none. */
    readonly beyond: string
    /** The answer to the interview question of the first page; empty when the record has none. */
    readonly answer: string
    /** The link of the repository nearest the learner's code, for the one command at the foot. */
    readonly nearestUrl: string
}

/** The words of the comparison. */
export type CourseProductionLabels = {
    readonly title: string
    readonly lead: string
    readonly tableLabel: string
    readonly repoColumn: string
    readonly legend: string
    readonly readTitle: string
    readonly beyondTitle: string
    readonly answerTitle: string
    readonly openNearest: string
    readonly externalHint: string
}

/** What the comparison needs. */
type CourseProductionProps = {
    readonly view: CourseProductionView
    readonly labels: CourseProductionLabels
}

/**
 * The table: a row per repository under a column per unhappy case, the learner's own code first. The heads are the case numbers and the
 * key under the table names each case in full, so every column fits the page at 1440 and the repository column (no truncation) shows
 * each name whole; on a phone the table scrolls sideways as a named region, the Grammar's own cue.
 */
const Comparison = (props: CourseProductionProps) => {
    const { view, labels } = props
    return (
        <Stack gap="inline">
            <DataTable
                label={labels.tableLabel}
                phone="table"
                rows={view.rows}
                columns={
                    [
                        { id: "repo", label: labels.repoColumn, isRowHeader: true, width: "fill", truncate: false },
                        ...view.columns.map((column) => ({
                            id: column.id,
                            label: column.label,
                            width: "fit" as const,
                        })),
                    ] satisfies DataTableColumn[]
                }
                emptyContent={labels.tableLabel}
                renderCell={(row, column) => {
                    if (column === "repo") {
                        return (
                            <Stack gap="identity">
                                <Text isStrong>{row.name}</Text>
                                {row.lang === "" ? null : (
                                    <Text role="caption" tone="muted">
                                        {row.lang}
                                    </Text>
                                )}
                            </Stack>
                        )
                    }
                    const cell = row.cells.find((each) => each.id === column)
                    if (cell === undefined) return ""
                    return cell.isMuted ? <Text tone="muted">{cell.text}</Text> : cell.text
                }}
            />
            <Stack gap="identity">
                {view.columns.map((column) => (
                    <Text key={column.id} role="caption" tone="muted">
                        {`${column.label}. ${column.title}`}
                    </Text>
                ))}
            </Stack>
            <Text role="caption" tone="muted">
                {labels.legend}
            </Text>
        </Stack>
    )
}

/**
 * The second half of the submit page, shown once the learner's code passed: the learner's file set beside real, public repositories that run
 * this for real users (a row each, a column per case they just fixed), each repository read in full with its file pinned to a commit,
 * what the learner did that none of them ships and the answer to the interview question the lesson opened with.
 */
export const CourseProduction = (props: CourseProductionProps) => {
    const { view, labels } = props
    return (
        <Stack gap="region">
            <Stack gap="section" measure="reading">
                <Text as="p" role="reading.title">
                    {labels.title}
                </Text>
                <Text as="p" role="reading.body" tone="muted">
                    {labels.lead}
                </Text>
            </Stack>
            <Comparison view={view} labels={labels} />
            <Section
                kind="list"
                title={labels.readTitle}
                headingLevel={2}
                empty={labels.readTitle}
                items={view.repos.map((repo) => ({
                    id: repo.id,
                    title: repo.name,
                    // The note is a few sentences: a row's description is one line with an ellipsis by design
                    // (DNA-COMMON-ROW-DESCRIPTION-ONE-LINE), so it is read in full as the first line of the row's detail.
                    detail: (
                        <Stack gap="identity">
                            <Text as="p" tone="muted">
                                {repo.note}
                            </Text>
                            <Text role="caption" tone="muted">
                                {repo.meta}
                            </Text>
                            {repo.files.map((file) => (
                                <Link
                                    key={file.url}
                                    href={file.url}
                                    kind="external"
                                    externalHint={labels.externalHint}
                                >
                                    {file.path}
                                </Link>
                            ))}
                        </Stack>
                    ),
                }))}
            />
            {view.beyond === "" ? null : (
                <Section title={labels.beyondTitle} headingLevel={2}>
                    <Stack gap="section" measure="reading">
                        <Text as="p" role="reading.body">
                            {view.beyond}
                        </Text>
                    </Stack>
                </Section>
            )}
            {view.answer === "" ? null : (
                <Section title={labels.answerTitle} headingLevel={2}>
                    <Stack gap="section" measure="reading">
                        <Text as="p" role="reading.body">
                            {`“${view.answer}”`}
                        </Text>
                    </Stack>
                </Section>
            )}
            {view.nearestUrl === "" ? null : (
                <Stack gap="inline" align="start">
                    <Button variant="primary" href={view.nearestUrl}>
                        {labels.openNearest}
                    </Button>
                </Stack>
            )}
        </Stack>
    )
}
