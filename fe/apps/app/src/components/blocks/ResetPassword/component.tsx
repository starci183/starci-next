import { Alert, Button, Form, Input, Stack, SurfaceCard } from "@starci/grammar/common"
import { AuthCardHeading } from "@starci-next/ui"

/** Props for {@link ResetPasswordBase}. */
export interface ResetPasswordBaseProps {
    readonly props: {
        readonly title: string
        readonly subtitle: string
        /** The notice above the form (an unreachable back end), or undefined. */
        readonly notice: string | undefined
        /** Set when the link is no longer usable: the form gives way to this notice and the way back to sign in. */
        readonly invalid:
            { readonly title: string; readonly againLabel: string; readonly signInHref: string } | undefined
        readonly newPasswordLabel: string
        readonly confirmLabel: string
        readonly passwordHint: string
        readonly passwordPlaceholder: string
        readonly confirmPlaceholder: string
        readonly reveal: string
        readonly hide: string
        readonly submitLabel: string
        readonly passwordError: string | undefined
        readonly confirmError: string | undefined
        readonly isPending: boolean
    }
    readonly on: { readonly submit: (input: FormData) => void }
}

/** The new-password form of the emailed reset link, or the notice that the link is no longer usable. */
const Body = (props: ResetPasswordBaseProps) => {
    if (props.props.invalid !== undefined) {
        return (
            <Stack gap="row">
                <Alert tone="negative" title={props.props.invalid.title} />
                <Button intent="commit" width="fill" href={props.props.invalid.signInHref}>
                    {props.props.invalid.againLabel}
                </Button>
            </Stack>
        )
    }
    return (
        <Form label={props.props.title} isPending={props.props.isPending} onSubmit={props.on.submit}>
            <Stack gap="row">
                {props.props.notice === undefined ? null : <Alert tone="negative" title={props.props.notice} />}
                <Input
                    id="auth-new-password"
                    name="password"
                    label={props.props.newPasswordLabel}
                    placeholder={props.props.passwordPlaceholder}
                    kind="newPassword"
                    description={props.props.passwordHint}
                    revealLabel={props.props.reveal}
                    hideLabel={props.props.hide}
                    isRequired
                    isInvalid={props.props.passwordError !== undefined}
                    errorMessage={props.props.passwordError}
                />
                <Input
                    id="auth-new-confirm"
                    name="confirm"
                    label={props.props.confirmLabel}
                    placeholder={props.props.confirmPlaceholder}
                    kind="newPassword"
                    revealLabel={props.props.reveal}
                    hideLabel={props.props.hide}
                    isRequired
                    isInvalid={props.props.confirmError !== undefined}
                    errorMessage={props.props.confirmError}
                />
                <Button type="submit" intent="commit" width="fill" isPending={props.props.isPending}>
                    {props.props.submitLabel}
                </Button>
            </Stack>
        </Form>
    )
}

/** The card the emailed reset link opens: the title, the support line and the form that sets the new password. */
export const ResetPasswordBase = (props: ResetPasswordBaseProps) => (
    <SurfaceCard ariaLabel={props.props.title} measure="formCompact">
        <Stack gap="section">
            <AuthCardHeading title={props.props.title} subtitle={props.props.subtitle} level={1} />
            <Body {...props} />
        </Stack>
    </SurfaceCard>
)
