import type { ReactNode } from "react"
import { Alert, Button, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The states of a session that has no scorecard to show. */
export type InterviewReportNoticeKind = "grading" | "failed" | "notReady" | "abandoned"

/** The words of the report notices. */
export type InterviewReportNoticeLabels = {
    readonly gradingTitle: string
    readonly gradingDescription: string
    readonly failedTitle: string
    readonly failedDescription: string
    readonly regrade: string
    readonly regrading: string
    readonly notReadyTitle: string
    readonly notReadyDescription: string
    readonly continue: string
    readonly abandonedTitle: string
    readonly abandonedDescription: string
    readonly home: string
}

/** What the notice needs: the state, its words, where its links go and the regrade. */
type InterviewReportNoticeProps = {
    readonly kind: InterviewReportNoticeKind
    readonly labels: InterviewReportNoticeLabels
    readonly roomHref: string
    readonly homeHref: string
    /** The words of the refusal of the last regrade, or empty. */
    readonly issueWords: string
    readonly isRegrading: boolean
    readonly onRegrade: () => void
}

type CardProps = {
    readonly title: string
    readonly text: string
    readonly extra: ReactNode
    readonly action: ReactNode
}

const Card = (props: CardProps) => (
    <SurfaceCard treatment="soft" label={props.title}>
        <Stack gap="row">
            <Text>{props.text}</Text>
            {props.extra}
            {props.action}
        </Stack>
    </SurfaceCard>
)

/**
 * The report of a session with no scorecard, one state for each status: being graded (a waiting alert), failed (the answers are kept and
 * the grading can be asked again), abandoned (no result, back to the home) and not submitted yet (back to the room).
 */
export const InterviewReportNotice = (props: InterviewReportNoticeProps) => {
    const { labels } = props
    if (props.kind === "grading") {
        return <Alert tone="informative" title={labels.gradingTitle} description={labels.gradingDescription} />
    }
    if (props.kind === "abandoned") {
        return (
            <Card
                title={labels.abandonedTitle}
                text={labels.abandonedDescription}
                extra={null}
                action={
                    <Button intent="neutral" href={props.homeHref}>
                        {labels.home}
                    </Button>
                }
            />
        )
    }
    if (props.kind === "notReady") {
        return (
            <Card
                title={labels.notReadyTitle}
                text={labels.notReadyDescription}
                extra={null}
                action={
                    <Button intent="commit" href={props.roomHref}>
                        {labels.continue}
                    </Button>
                }
            />
        )
    }
    return (
        <Card
            title={labels.failedTitle}
            text={labels.failedDescription}
            extra={props.issueWords === "" ? null : <Alert tone="negative" title={props.issueWords} />}
            action={
                <Button intent="commit" isPending={props.isRegrading} onPress={props.onRegrade}>
                    {props.isRegrading ? labels.regrading : labels.regrade}
                </Button>
            }
        />
    )
}
