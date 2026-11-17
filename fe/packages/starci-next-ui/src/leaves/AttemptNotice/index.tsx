import { Alert, Button } from "@starci/grammar/common"

/** Where an attempt stands; only the states that say something to the learner are drawn. */
type AttemptNoticeStatus = "idle" | "pending" | "saved" | "grading" | "graded" | "failed" | "premium"

/** The words of the notice and the one way out of a refusal. */
type AttemptNoticeProps = {
    readonly status: AttemptNoticeStatus
    /** True when the last send was rejected by the transport. */
    readonly isSendFailed: boolean
    /** Said when the answer was saved. */
    readonly saved: string
    /** Said while the answer is being graded. */
    readonly grading: string
    /** Said when the answer is saved but its grading failed. */
    readonly failedSaved: string
    /** Said when the answer could not be sent. */
    readonly error: string
    /** Said when the plan does not include saving the attempt. */
    readonly premium: string
    readonly plansLabel: string
    /** The destination of the plans page. */
    readonly plansHref: string
}

/** What an attempt says after it was sent: saved, grading, saved but not graded, not sent, or refused for Premium with the link to the plans. */
export const AttemptNotice = (props: AttemptNoticeProps) => {
    if (props.isSendFailed) return <Alert tone="negative" title={props.error} />
    switch (props.status) {
        case "saved":
            return <Alert tone="informative" title={props.saved} />
        case "grading":
            return <Alert tone="informative" title={props.grading} />
        case "failed":
            return <Alert tone="cautionary" title={props.failedSaved} />
        case "premium":
            return (
                <>
                    <Alert tone="cautionary" title={props.premium} />
                    <Button intent="alternative" href={props.plansHref}>
                        {props.plansLabel}
                    </Button>
                </>
            )
        case "idle":
        case "pending":
        case "graded":
            return null
    }
}
