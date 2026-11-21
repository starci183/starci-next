import { Alert, Button, Spinner, Stack, SurfaceCard } from "@starci/grammar/common"
import { AuthCardHeading } from "@starci-next/ui"

/** Props for {@link ConfirmEmailBase}. */
export interface ConfirmEmailBaseProps {
    readonly props: {
        readonly title: string
        readonly text: string
        /** True while the emailed link is being spent: the spinner is drawn and no action. */
        readonly isWorking: boolean
        /** The notice under the text when the back end could not be reached, or undefined. */
        readonly failureTitle: string | undefined
        readonly signInLabel: string
        readonly signInHref: string
    }
}

/** The card the emailed confirmation link opens: what the link came to in words, and the way on to sign in. */
export const ConfirmEmailBase = (props: ConfirmEmailBaseProps) => (
    <SurfaceCard ariaLabel={props.props.title} measure="formCompact">
        <Stack gap="section">
            <AuthCardHeading title={props.props.title} subtitle={props.props.text} level={1} />
            {props.props.isWorking ? <Spinner label={props.props.text} /> : null}
            {props.props.failureTitle === undefined ? null : <Alert tone="negative" title={props.props.failureTitle} />}
            {props.props.isWorking ? null : (
                <Button intent="commit" width="fill" href={props.props.signInHref}>
                    {props.props.signInLabel}
                </Button>
            )}
        </Stack>
    </SurfaceCard>
)
