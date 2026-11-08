import { Alert, Button, Cluster, Stack, Text } from "@starci/grammar/common"

/** The words of the retry notice. */
export type InterviewRetryNoticeLabels = {
    readonly saved: string
    readonly retry: string
    readonly retrying: string
}

/** The notice of an interviewer step that failed. */
type InterviewRetryNoticeProps = {
    readonly labels: InterviewRetryNoticeLabels
    /** The words of the refusal, or empty. */
    readonly issueWords: string
    /** True when the refusal means the transcript is saved and only the interviewer step is missing. */
    readonly isIssueSaved: boolean
    /** True when the last turn is an answer the interviewer has not replied to. */
    readonly needsReply: boolean
    /** True while the interviewer is asked again. */
    readonly isRetrying: boolean
    readonly onRetry: () => void
}

/** The notice of a step that failed after the answer was saved, with the way to ask the interviewer again. */
export const InterviewRetryNotice = (props: InterviewRetryNoticeProps) => {
    if (!props.needsReply && props.issueWords === "") return null
    return (
        <Stack gap="inline">
            {props.issueWords === "" ? null : (
                <Alert tone={props.isIssueSaved ? "cautionary" : "negative"} title={props.issueWords} />
            )}
            {props.needsReply ? (
                <Cluster gap="inline" align="center">
                    <Text size="sm" tone="muted">
                        {props.labels.saved}
                    </Text>
                    <Button intent="neutral" isPending={props.isRetrying} onPress={props.onRetry}>
                        {props.isRetrying ? props.labels.retrying : props.labels.retry}
                    </Button>
                </Cluster>
            ) : null}
        </Stack>
    )
}
