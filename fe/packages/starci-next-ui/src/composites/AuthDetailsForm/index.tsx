import { Button, Checkbox, Form, Input, Stack, TextAction } from "@starci/grammar/common"

/** The three detail forms: sign in, create an account, ask for a reset code. */
type AuthDetailsShape = "signIn" | "signUp" | "forgot"

/** The words of the details form, resolved by the connected block. */
export interface AuthDetailsLabels {
    readonly form: string
    readonly identifier: string
    readonly email: string
    readonly password: string
    readonly newPassword: string
    readonly confirm: string
    readonly passwordHint: string
    readonly emailPlaceholder: string
    readonly passwordPlaceholder: string
    readonly confirmPlaceholder: string
    readonly reveal: string
    readonly hide: string
    readonly terms: string
    readonly forgotLink: string
    readonly submit: string
}

/** The details form as the connected block resolves it; each `*Error` is the resolved message under that field, or undefined. */
type AuthDetailsFormProps = {
    readonly shape: AuthDetailsShape
    readonly labels: AuthDetailsLabels
    readonly isPending: boolean
    readonly isTermsAccepted: boolean
    /** The credentials were refused: the password field is marked without a second message (the alert says it). */
    readonly isRefused: boolean
    readonly emailError: string | undefined
    readonly passwordError: string | undefined
    readonly confirmError: string | undefined
    readonly onSubmit: (input: FormData) => void
    readonly onTermsChange: (isAccepted: boolean) => void
    readonly onForgot: () => void
}

/** What the sign-up extras need: the confirmation field and the terms checkbox. */
type SignUpExtrasProps = {
    readonly labels: AuthDetailsLabels
    readonly isTermsAccepted: boolean
    readonly confirmError: string | undefined
    readonly onTermsChange: (isAccepted: boolean) => void
}

/** The confirmation of a new password and the terms the learner accepts. */
const SignUpExtras = (props: SignUpExtrasProps) => (
    <>
        <Input
            id="auth-confirm"
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
        <Checkbox
            name="acceptTerms"
            label={props.labels.terms}
            isSelected={props.isTermsAccepted}
            onSelectedChange={props.onTermsChange}
        />
    </>
)

/** What the password field needs. */
type PasswordFieldProps = {
    readonly labels: AuthDetailsLabels
    readonly isSignUp: boolean
    readonly isInvalid: boolean
    readonly error: string | undefined
}

/** The password field: a new password with its rule hint on sign-up, the current one otherwise. */
const PasswordField = (props: PasswordFieldProps) => (
    <Input
        id="auth-password"
        name="password"
        label={props.labels.password}
        placeholder={props.labels.passwordPlaceholder}
        kind={props.isSignUp ? "newPassword" : "password"}
        description={props.isSignUp ? props.labels.passwordHint : undefined}
        revealLabel={props.labels.reveal}
        hideLabel={props.labels.hide}
        isRequired
        isInvalid={props.isInvalid}
        errorMessage={props.error}
    />
)

/** What the credential fields need: the whole form but its submit and pending flag. */
type FieldsProps = Omit<AuthDetailsFormProps, "onSubmit" | "isPending">

/** The credential fields of the shape: identifier and password, email and password pair with terms, or the email alone. */
const Fields = (props: FieldsProps) => {
    const isSignUp = props.shape === "signUp"
    return (
        <>
            <Input
                id="auth-email"
                name="email"
                label={props.shape === "signIn" ? props.labels.identifier : props.labels.email}
                placeholder={props.labels.emailPlaceholder}
                kind={props.shape === "signIn" ? "text" : "email"}
                isRequired
                isInvalid={props.emailError !== undefined}
                errorMessage={props.emailError}
            />
            {props.shape === "forgot" ? null : (
                <PasswordField
                    labels={props.labels}
                    isSignUp={isSignUp}
                    isInvalid={props.passwordError !== undefined || props.isRefused}
                    error={props.passwordError}
                />
            )}
            {isSignUp ? (
                <SignUpExtras
                    labels={props.labels}
                    isTermsAccepted={props.isTermsAccepted}
                    confirmError={props.confirmError}
                    onTermsChange={props.onTermsChange}
                />
            ) : null}
            {props.shape === "signIn" ? (
                <TextAction onPress={props.onForgot}>{props.labels.forgotLink}</TextAction>
            ) : null}
        </>
    )
}

/** The details form of the sign-in screen: the fields of its shape and the one primary submit. */
export const AuthDetailsForm = (props: AuthDetailsFormProps) => (
    <Form label={props.labels.form} isPending={props.isPending} onSubmit={props.onSubmit}>
        <Stack gap="row">
            <Fields {...props} />
            <Button
                type="submit"
                intent="commit"
                width="fill"
                isPending={props.isPending}
                isDisabled={props.shape === "signUp" && !props.isTermsAccepted}
            >
                {props.labels.submit}
            </Button>
        </Stack>
    </Form>
)
