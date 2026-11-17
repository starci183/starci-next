import { Button, Cluster, Form, Input, OtpInput, Stack, Text, TextAction } from "@starci/grammar/common"

/** The words of the code form, resolved by the connected block. */
export interface AuthCodeLabels {
    readonly form: string
    readonly code: string
    readonly lifetime: string
    readonly newPassword: string
    readonly confirm: string
    readonly passwordHint: string
    readonly passwordPlaceholder: string
    readonly confirmPlaceholder: string
    readonly reveal: string
    readonly hide: string
    readonly submit: string
    readonly resend: string
    readonly anotherEmail: string
}

/** The code form as the connected block resolves it; a reset also asks for the new password (`isReset`). */
type AuthCodeFormProps = {
    readonly labels: AuthCodeLabels
    readonly isReset: boolean
    readonly isPending: boolean
    readonly codeError: string | undefined
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
    readonly onSubmit: (input: FormData) => void
    /** The learner typed in the code boxes: the refusal under them no longer describes what is there. */
    readonly onCodeChange: () => void
    readonly onResend: () => void
    readonly onAnotherEmail: () => void
}

/** The new-password pair a reset asks for beside the code. */
type NewPasswordFieldsProps = {
    readonly labels: AuthCodeLabels
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
}

/** The new password and its confirmation, each with its own refusal. */
const NewPasswordFields = (props: NewPasswordFieldsProps) => (
    <>
        <Input
            id="auth-new-password"
            name="password"
            label={props.labels.newPassword}
            placeholder={props.labels.passwordPlaceholder}
            kind="newPassword"
            description={props.labels.passwordHint}
            revealLabel={props.labels.reveal}
            hideLabel={props.labels.hide}
            isRequired
            isInvalid={props.passwordError !== undefined}
            errorMessage={props.passwordError}
        />
        <Input
            id="auth-new-confirm"
            name="confirm"
            label={props.labels.confirm}
            placeholder={props.labels.confirmPlaceholder}
            kind="newPassword"
            revealLabel={props.labels.reveal}
            hideLabel={props.labels.hide}
            isRequired
            isInvalid={props.confirmError !== undefined}
            errorMessage={props.confirmError}
        />
    </>
)

/** The six digit boxes with the code lifetime or the refusal under them, the primary submit, and the resend and other-email actions. */
export const AuthCodeForm = (props: AuthCodeFormProps) => (
    <Form label={props.labels.form} isPending={props.isPending} onSubmit={props.onSubmit}>
        <Stack gap="row">
            <Stack gap="identity">
                <OtpInput
                    id="auth-code"
                    name="code"
                    label={props.labels.code}
                    describedBy="auth-code-hint"
                    isInvalid={props.codeError !== undefined}
                    onValueChange={props.onCodeChange}
                />
                <Text
                    id="auth-code-hint"
                    size="sm"
                    tone="muted"
                    live={props.codeError === undefined ? "off" : "assertive"}
                >
                    {props.codeError ?? props.labels.lifetime}
                </Text>
            </Stack>
            {props.isReset ? (
                <NewPasswordFields
                    labels={props.labels}
                    passwordError={props.passwordError}
                    confirmError={props.confirmError}
                />
            ) : null}
            <Button type="submit" intent="commit" width="fill" isPending={props.isPending}>
                {props.labels.submit}
            </Button>
            <Cluster gap="inline" justify="between">
                <TextAction onPress={props.onResend} isDisabled={props.isPending}>
                    {props.labels.resend}
                </TextAction>
                <TextAction onPress={props.onAnotherEmail}>{props.labels.anotherEmail}</TextAction>
            </Cluster>
        </Stack>
    </Form>
)
