import { useState } from "react"
import { Alert, Button, Form, Input, Stack, SurfaceCard } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { AuthCardHeading, AuthLinkNotice, AuthPasswordLength } from "@starci-next/ui"

/** Props for {@link ResetPasswordBase}. */
export interface ResetPasswordBaseProps {
    readonly props: {
        readonly title: string
        readonly subtitle: string
        /** The welcome picture above the card's content. */
        readonly art: ReactNode
        /** The notice above the form (an unreachable back end), or undefined. */
        readonly notice: string | undefined
        /** Set when the link is no longer usable: the card gives way to the expired-link card and the way back to sign in. */
        readonly invalid:
            | {
                  readonly title: string
                  readonly text: string
                  readonly facts: { readonly once: string; readonly expires: string; readonly again: string }
                  readonly againLabel: string
                  readonly signInHref: string
              }
            | undefined
        readonly newPasswordLabel: string
        readonly confirmLabel: string
        readonly passwordLength: {
            readonly label: string
            readonly min: number
            readonly max: number
            readonly reading: (count: number) => string
        }
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

/** The new-password form of the emailed reset link, with the length gauge under the first field. */
const NewPasswordForm = (props: ResetPasswordBaseProps) => {
    const [count, setCount] = useState(0)
    const length = props.props.passwordLength
    return (
        <Form label={props.props.title} isPending={props.props.isPending} onSubmit={props.on.submit}>
            <Stack gap="row">
                {props.props.notice === undefined ? null : <Alert tone="negative" title={props.props.notice} />}
                <Stack gap="identity">
                    <Input
                        id="auth-new-password"
                        name="password"
                        label={props.props.newPasswordLabel}
                        placeholder={props.props.passwordPlaceholder}
                        kind="newPassword"
                        onValueChange={(value) => setCount(value.length)}
                        revealLabel={props.props.reveal}
                        hideLabel={props.props.hide}
                        isRequired
                        isInvalid={props.props.passwordError !== undefined}
                        errorMessage={props.props.passwordError}
                    />
                    <AuthPasswordLength
                        label={length.label}
                        count={count}
                        min={length.min}
                        max={length.max}
                        reading={length.reading(count)}
                    />
                </Stack>
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
                <Button type="submit" variant="primary" width="fill" isPending={props.props.isPending}>
                    {props.props.submitLabel}
                </Button>
            </Stack>
        </Form>
    )
}

/** The card the emailed reset link opens: the new-password form, or the expired-link card when the link is no longer usable. */
export const ResetPasswordBase = (props: ResetPasswordBaseProps) => (
    <SurfaceCard ariaLabel={props.props.invalid?.title ?? props.props.title} measure="formCompact">
        {props.props.invalid !== undefined ? (
            <AuthLinkNotice
                art={props.props.art}
                title={props.props.invalid.title}
                text={props.props.invalid.text}
                facts={props.props.invalid.facts}
                actionLabel={props.props.invalid.againLabel}
                actionHref={props.props.invalid.signInHref}
            />
        ) : (
            <Stack gap="section">
                {props.props.art}
                <AuthCardHeading title={props.props.title} subtitle={props.props.subtitle} level={1} />
                <NewPasswordForm {...props} />
            </Stack>
        )}
    </SurfaceCard>
)
