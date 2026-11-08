import { Alert, Badge, Cluster, DisclosureList, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The tone of a badge of the report. */
export type ReportTone = "success" | "warning" | "danger" | "muted"

/** One checklist item or STAR dimension of a question, already in words. */
export type ReportItem = {
    readonly id: string
    readonly title: string
    readonly badge: string
    readonly tone: ReportTone
    readonly critical: string
    readonly quoteLabel: string
    readonly quote: string
}

/** One question of the report, already in words. */
export type ReportQuestion = {
    readonly id: string
    readonly title: string
    readonly prompt: string
    readonly scoreLine: string
    readonly tone: ReportTone
    readonly skipped: string
    readonly items: ReadonlyArray<ReportItem>
    readonly lines: ReadonlyArray<string>
    readonly note: string
    readonly ideal: string
}

/** The words of a question card. */
export type InterviewQuestionCardLabels = {
    readonly note: string
    readonly stronger: string
}

/** One question of a graded report. */
type InterviewQuestionCardProps = {
    readonly question: ReportQuestion
    readonly labels: InterviewQuestionCardLabels
}

type ItemProps = { readonly item: ReportItem }

/** One item of a question with its badge, the critical mark and the quote of the answer that earns it. */
const Item = (props: ItemProps) => (
    <Stack gap="inline">
        <Cluster gap="inline" wrap align="center">
            <Badge tone={props.item.tone}>{props.item.badge}</Badge>
            {props.item.critical === "" ? null : <Badge tone="danger">{props.item.critical}</Badge>}
            <Text isStrong>{props.item.title}</Text>
        </Cluster>
        {props.item.quote === "" ? null : (
            <Text size="sm" tone="muted">
                {`${props.item.quoteLabel}: “${props.item.quote}”`}
            </Text>
        )}
    </Stack>
)

/** One question of the report: its score, each point graded with its evidence, the lines on hints, and the stronger answer collapsed. */
export const InterviewQuestionCard = (props: InterviewQuestionCardProps) => {
    const { question, labels } = props
    return (
        <SurfaceCard label={question.title}>
            <Stack gap="row">
                <Text>{question.prompt}</Text>
                <Cluster gap="inline" wrap align="center">
                    <Badge tone={question.tone}>{question.scoreLine}</Badge>
                    {question.skipped === "" ? null : <Badge tone="muted">{question.skipped}</Badge>}
                </Cluster>
                {question.items.map((item) => (
                    <Item key={item.id} item={item} />
                ))}
                {question.lines.map((line) => (
                    <Alert key={line} tone="cautionary" title={line} />
                ))}
                {question.note === "" ? null : <Text size="sm">{`${labels.note}: ${question.note}`}</Text>}
                {question.ideal === "" ? null : (
                    <DisclosureList
                        label={labels.stronger}
                        items={[{ id: "ideal", title: labels.stronger, body: question.ideal }]}
                    />
                )}
            </Stack>
        </SurfaceCard>
    )
}
