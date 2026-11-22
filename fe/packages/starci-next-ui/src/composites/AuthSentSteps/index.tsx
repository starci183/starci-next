import { Stepper } from "@starci/grammar/common"

/** The three steps of the emailed link and where the reader is. */
type AuthSentStepsProps = {
    readonly label: string
    readonly steps: { readonly sent: string; readonly open: string; readonly confirm: string }
}

/** Sent, open the mail, confirm: the sent step is done and the reader is on the second. */
export const AuthSentSteps = (props: AuthSentStepsProps) => (
    <Stepper
        label={props.label}
        steps={[
            { id: "sent", label: props.steps.sent },
            { id: "open", label: props.steps.open },
            { id: "confirm", label: props.steps.confirm },
        ]}
        currentStepId="open"
    />
)
