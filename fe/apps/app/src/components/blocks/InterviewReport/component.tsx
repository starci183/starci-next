import { Badge, Cluster, Grid, Heading, Link, Page, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import {
    InterviewAttributeBars,
    InterviewExitLinks,
    InterviewQuestionCard,
    SlotView,
    type ReportQuestion,
    type ReportTone,
    InterviewReportNotice,
} from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One pillar of the score, already in words. */
export type ReportPillarView = {
    readonly label: string
    readonly score: string
    readonly verdict: string
    readonly tone: ReportTone
}

/** One thing to study again, with the lessons it links to. */
export type ReportGapView = {
    readonly id: string
    readonly text: string
    readonly links: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>
}

/** A graded report. */
export type ReportReadyView = {
    readonly kind: "ready"
    readonly overall: string
    readonly verdict: string
    readonly tone: ReportTone
    readonly pillars: ReadonlyArray<ReportPillarView>
    readonly fallback: string
    readonly attributes: ReadonlyArray<{ readonly id: string; readonly label: string; readonly score: number }>
    readonly questions: ReadonlyArray<ReportQuestion>
    readonly strengths: ReadonlyArray<string>
    readonly gaps: ReadonlyArray<ReportGapView>
    /** The gaps with no lesson to open, as one line of words; empty when every gap has a lesson. */
    readonly looseGaps: string
    /** The change against the previous graded interview, as words; empty when there is none. */
    readonly delta: string
    /** The words of the link to the review, with the number of gaps; empty when there is no gap. */
    readonly reviewLine: string
}

/** The report as it is drawn: graded, being graded, failed, or not submitted yet. */
export type InterviewReportView = ReportReadyView | { readonly kind: "grading" | "failed" | "notReady" | "abandoned" }

/** The fake report with the geometry of a settled one, drawn as a skeleton while the first read runs. */
export const INTERVIEW_REPORT_PLACEHOLDER: InterviewReportView = {
    kind: "ready",
    overall: "00",
    verdict: "xxxxxx",
    tone: "muted",
    pillars: [
        { label: "xxxxxx", score: "00", verdict: "xxxxxx", tone: "muted" },
        { label: "xxxxxxx", score: "00", verdict: "xxxxxxx", tone: "muted" },
    ],
    fallback: "",
    attributes: [{ id: "p1", label: "xxxxxx", score: 50 }],
    questions: [],
    strengths: [],
    gaps: [],
    looseGaps: "",
    delta: "",
    reviewLine: "",
}

/** The fixed words of the report. */
export type InterviewReportLabels = {
    readonly title: string
    readonly overall: string
    readonly outOf: string
    readonly attributesTitle: string
    readonly strengthsTitle: string
    readonly gapsTitle: string
    readonly gapsEmpty: string
    readonly breadcrumb: string
    readonly studyAgain: string
    readonly stronger: string
    readonly note: string
    readonly yourAnswer: string
    readonly retake: string
    readonly home: string
    readonly gradingTitle: string
    readonly gradingDescription: string
    readonly failedTitle: string
    readonly failedDescription: string
    readonly regrade: string
    readonly regrading: string
    readonly notReadyTitle: string
    readonly notReadyDescription: string
    readonly abandonedTitle: string
    readonly abandonedDescription: string
    readonly continue: string
}

/** Props for {@link InterviewReportBase}. */
export type InterviewReportBaseProps = {
    readonly props: {
        readonly slot: DataSlot<InterviewReportView>
        readonly placeholder: InterviewReportView
        readonly slotLabels: SlotLabels
        readonly labels: InterviewReportLabels
        /** The words of the refusal of the last regrade, or empty. */
        readonly issueWords: string
        /** True while a failed grading is being run again. */
        readonly isRegrading: boolean
        readonly retakeHref: string
        readonly homeHref: string
        readonly roomHref: string
        readonly reviewHref: string
    }
    readonly on: { readonly retryRead: () => void; readonly regrade: () => void }
}

type ReadyProps = { readonly view: ReportReadyView; readonly labels: InterviewReportLabels }

/** The score header: the overall score and verdict, and the two pillars apart. */
const ScoreHeader = (props: ReadyProps) => (
    <SurfaceCard label={props.labels.overall}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center">
                <Heading level={2} scale="standard">
                    {props.view.overall}
                </Heading>
                <Text tone="muted">{props.labels.outOf}</Text>
                <Badge tone={props.view.tone}>{props.view.verdict}</Badge>
            </Cluster>
            <Grid kind="cards">
                {props.view.pillars.map((pillar) => (
                    <Stack key={pillar.label} gap="inline">
                        <Text size="sm" tone="muted">
                            {pillar.label}
                        </Text>
                        <Cluster gap="inline" align="center">
                            <Text isStrong>{pillar.score}</Text>
                            <Badge tone={pillar.tone}>{pillar.verdict}</Badge>
                        </Cluster>
                    </Stack>
                ))}
            </Grid>
            {props.view.delta === "" ? null : <Badge tone="muted">{props.view.delta}</Badge>}
            {props.view.fallback === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.view.fallback}
                </Text>
            )}
        </Stack>
    </SurfaceCard>
)

/** What to keep and what to study again, each gap with its Essentials lessons. */
const Summary = (props: ReadyProps) => (
    <Stack gap="region">
        <SurfaceCard label={props.labels.strengthsTitle}>
            <Stack gap="inline">
                {props.view.strengths.map((each) => (
                    <Text key={each}>{each}</Text>
                ))}
            </Stack>
        </SurfaceCard>
        <SurfaceCard label={props.labels.gapsTitle}>
            <Stack gap="row">
                {props.view.gaps.length === 0 && props.view.looseGaps === "" ? (
                    <Text tone="muted">{props.labels.gapsEmpty}</Text>
                ) : null}
                {props.view.gaps.map((gap) => (
                    <Stack key={gap.id} gap="inline">
                        <Text>{gap.text}</Text>
                        <Cluster gap="inline" wrap>
                            {gap.links.map((link) => (
                                <Link variant="plain" key={link.id} href={link.href}>
                                    {`${props.labels.studyAgain}: ${link.label}`}
                                </Link>
                            ))}
                        </Cluster>
                    </Stack>
                ))}
                {props.view.looseGaps === "" ? null : (
                    <Text size="sm" tone="muted">
                        {props.view.looseGaps}
                    </Text>
                )}
            </Stack>
        </SurfaceCard>
    </Stack>
)

/**
 * Draws the report the way the canvas does: the score and verdict with the technical and behavioural pillars apart, the bars of
 * the dimensions, one card per question with each point graded and the learner's own words as evidence, what went well, and what to
 * study again with the lessons to open. A session still being graded, failed, or not submitted says so in place of the scores.
 */
export const InterviewReportBase = (props: InterviewReportBaseProps) => (
    <Page
        header={{
            title: props.props.labels.title,
            titleScale: "standard" as const,
            breadcrumbs: {
                label: props.props.labels.breadcrumb,
                items: [
                    { id: "interview", label: props.props.labels.breadcrumb, href: props.props.homeHref },
                    { id: "report", label: props.props.labels.title },
                ],
            },
        }}
    >
        <SlotView
            slot={props.props.slot}
            placeholder={props.props.placeholder}
            labels={props.props.slotLabels}
            onRetry={props.on.retryRead}
            render={(view) =>
                view.kind === "ready" ? (
                    <Stack gap="region">
                        <ScoreHeader view={view} labels={props.props.labels} />
                        <InterviewAttributeBars
                            title={props.props.labels.attributesTitle}
                            attributes={view.attributes}
                        />
                        {view.questions.map((question) => (
                            <InterviewQuestionCard key={question.id} question={question} labels={props.props.labels} />
                        ))}
                        <Summary view={view} labels={props.props.labels} />
                        {view.reviewLine === "" ? null : <Link variant="plain" href={props.props.reviewHref}>{view.reviewLine}</Link>}
                        <InterviewExitLinks
                            first={{ label: props.props.labels.retake, href: props.props.retakeHref }}
                            firstIntent="commit"
                            second={{ label: props.props.labels.home, href: props.props.homeHref }}
                        />
                    </Stack>
                ) : (
                    <InterviewReportNotice
                        kind={view.kind}
                        labels={props.props.labels}
                        roomHref={props.props.roomHref}
                        homeHref={props.props.homeHref}
                        issueWords={props.props.issueWords}
                        isRegrading={props.props.isRegrading}
                        onRegrade={props.on.regrade}
                    />
                )
            }
        />
    </Page>
)
