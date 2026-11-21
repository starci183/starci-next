import { CheckIcon, LockClosedIcon, PlayIcon, XMarkIcon } from "@heroicons/react/24/outline"
import {
    Alert,
    Badge,
    Button,
    Cluster,
    FencedCodeBlock,
    Grid,
    ProgressCircle,
    Section,
    Stack,
    SurfaceCard,
    Text,
} from "@starci/grammar/common"
import type { ReactNode } from "react"
import type { BugHuntLabels, BugHuntView, BugRowState, BugRowView } from "../LessonFiveParts/types"

export type { BugHuntLabels, BugHuntView, BugRowState, BugRowView } from "../LessonFiveParts/types"

/** The tile ground a test state takes: green for a pass, red for a fail, none while it waits. */
const groundOf = (state: BugRowState) => {
    if (state === "passed") return "success" as const
    return state === "failed" ? ("danger" as const) : undefined
}

/** The badge tone of a test state. */
const toneOf = (state: BugRowState) => {
    if (state === "passed") return "success" as const
    if (state === "failed") return "danger" as const
    return state === "running" ? ("warning" as const) : ("muted" as const)
}

/** The mark of a test tile: a check, a cross, a play while it runs, a lock while it waits. */
const markOf = (state: BugRowState) => {
    if (state === "passed") return CheckIcon
    if (state === "failed") return XMarkIcon
    return state === "locked" ? LockClosedIcon : PlayIcon
}

/** What the run strip needs. */
type RunStripProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly onCopy: (text: string) => void
}

/** The strip on top: the ring of passed tests, the run line and the machine, then the one command that pulls and runs the pack. */
const RunStrip = (props: RunStripProps) => {
    const { view, labels } = props
    const share = view.total === 0 ? 0 : Math.round((view.passed / view.total) * 100)
    return (
        <Stack gap="section">
            <Cluster gap="section" align="center">
                <ProgressCircle label={labels.ring(view.passed, view.total)} value={share} size="lg" />
                <Stack gap="identity">
                    <Text as="p" size="figure" isStrong tabular>
                        {`${view.passed}/${view.total}`}
                    </Text>
                    <Text tone="muted">{view.runTitle}</Text>
                    {view.machine === "" ? (
                        <Badge tone="warning">{labels.machineNone}</Badge>
                    ) : (
                        <Badge isDot tone="success">
                            {labels.machineOnline(view.machine)}
                        </Badge>
                    )}
                </Stack>
            </Cluster>
            <FencedCodeBlock
                code={view.commands}
                language="bash"
                showLanguage={false}
                label={labels.pullTitle}
                action={
                    <Button intent="neutral" size="sm" onPress={() => props.onCopy(view.commands)}>
                        {labels.copy}
                    </Button>
                }
            />
            {view.machine === "" ? (
                <Alert tone="cautionary" title={labels.machineNone} description={labels.machineNoneNote} />
            ) : null}
        </Stack>
    )
}

/** What the grid of bug tiles needs. */
type BugTilesProps = {
    readonly rows: ReadonlyArray<BugRowView>
    readonly labels: BugHuntLabels
    readonly isLoading: boolean
}

/** The bug tests as a grid of tiles: red or green by the newest run, the name of the bug and the essence it belongs to. */
const BugTiles = (props: BugTilesProps) => (
    <Section title={props.labels.tilesTitle} headingLevel={2} isLoading={props.isLoading}>
        <Grid kind="cards" size="tile" columns="balanced">
            {props.rows.map((row) => {
                const ground = groundOf(row.state)
                return (
                    <SurfaceCard
                        key={row.id}
                        kind="tile"
                        name={row.title}
                        byline={row.caption}
                        mark={{ icon: markOf(row.state) }}
                        badge={{ label: row.stateLabel, tone: toneOf(row.state) }}
                        {...(ground === undefined ? {} : { groundTone: ground })}
                        {...(row.state === "locked" ? { state: "unavailable" as const } : {})}
                        wholeAction={{ kind: "link", href: `#bug-${row.id}`, label: row.title }}
                    />
                )
            })}
        </Grid>
    </Section>
)

/** What one comparison card needs. */
type CompareProps = {
    readonly row: BugRowView
    readonly labels: BugHuntLabels
    readonly onHint: (testId: string) => void
}

/** The expected and the received value of a test as two numbers side by side. */
const Figures = (props: CompareProps) => (
    <Section
        kind="figures"
        ariaLabel={props.row.title}
        items={[
            { id: "expected", term: props.labels.expected, value: props.row.expected, unit: props.row.measure },
            { id: "received", term: props.labels.received, value: props.row.received, unit: props.row.measure },
        ]}
    />
)

/** One red test: the two numbers, the one line of why, the hints opened so far and the button for the next. */
const CompareCard = (props: CompareProps) => {
    const { row } = props
    return (
        <div id={`bug-${row.id}`}>
            <SurfaceCard
                label={row.title}
                fact={row.caption}
                headingLevel={3}
                state="negative"
                {...(row.nextHint === ""
                    ? {}
                    : {
                          actions: (
                              <Button
                                  intent="neutral"
                                  size="sm"
                                  isPending={row.isOpeningHint}
                                  onPress={() => props.onHint(row.id)}
                              >
                                  {row.nextHint}
                              </Button>
                          ),
                      })}
            >
                <Stack gap="inline">
                    {row.expected === "" ? null : <Figures {...props} />}
                    {row.fail === "" ? null : <Text tone="muted">{row.fail}</Text>}
                    {row.hints.length === 0 ? null : (
                        <Cluster gap="inline">
                            {row.hints.map((hint) => (
                                <Badge key={hint.id} tone="accent">
                                    {`${hint.label} · ${hint.text}`}
                                </Badge>
                            ))}
                        </Cluster>
                    )}
                </Stack>
            </SurfaceCard>
        </div>
    )
}

/** What the part needs. */
type EssentialBugHuntProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly isLoading?: boolean
    readonly onCopy: (text: string) => void
    readonly onHint: (testId: string) => void
}

/** The line a green test keeps: the reason it is right now, in one alert. */
const PassedNote = (props: { readonly row: BugRowView; readonly labels: BugHuntLabels }): ReactNode =>
    props.row.pass === "" ? null : (
        <Alert
            tone="affirmative"
            title={`${props.row.title} · ${props.labels.passTitle}`}
            description={props.row.pass}
        />
    )

/**
 * Tìm sạn: one strip (the ring of passed tests, the run, the machine, the command), the bugs as a grid of green and red tiles, then
 * what each red test expected against what it received as two numbers with its hints one at a time. The final test waits for the rest.
 */
export const EssentialBugHunt = (props: EssentialBugHuntProps) => {
    const { view, labels } = props
    const isLoading = props.isLoading === true
    const red = view.rows.filter((row) => row.state === "failed")
    const green = view.rows.filter((row) => row.state === "passed")
    return (
        <Stack gap="region">
            <RunStrip view={view} labels={labels} onCopy={props.onCopy} />
            {view.rows.length === 0 ? <Text tone="muted">{labels.runsEmpty}</Text> : null}
            <BugTiles rows={view.rows} labels={labels} isLoading={isLoading} />
            {red.length === 0 ? null : (
                <Section title={labels.compareTitle} headingLevel={2}>
                    <Grid kind="cards" columns={2}>
                        {red.map((row) => (
                            <CompareCard key={row.id} row={row} labels={labels} onHint={props.onHint} />
                        ))}
                    </Grid>
                </Section>
            )}
            {green.map((row) => (
                <PassedNote key={row.id} row={row} labels={labels} />
            ))}
        </Stack>
    )
}

/** What the right column of Tìm sạn needs. */
type EssentialBugHuntAsideProps = {
    readonly view: BugHuntView
    readonly labels: BugHuntLabels
    readonly journey: ReactNode
}

/** The right column of Tìm sạn: the one line that unlocks Challenges, then the parts. */
export const EssentialBugHuntAside = (props: EssentialBugHuntAsideProps) => (
    <Stack gap="section">
        <Alert
            tone={props.view.isChallengesLocked ? "neutral" : "affirmative"}
            title={props.labels.asideUnlockTitle}
            description={props.view.isChallengesLocked ? props.labels.asideUnlock : props.labels.asideUnlocked}
        />
        {props.journey}
    </Stack>
)
