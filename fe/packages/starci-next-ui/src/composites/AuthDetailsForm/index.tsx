import { Button, Checkbox, Cluster, Form, Input, Stack, Text, TextAction } from "@starci/grammar/common"

/** The three detail forms: sign in, create an account, ask for a reset link. */
type AuthDetailsShape = "signIn" | "signUp" | "forgot"

/** The words of the details form, resolved by the connected block. */
export interface AuthDetailsLabels {
    readonly form: string
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
    /** Why the sign-up submit waits: the terms are not accepted yet. */
    readonly termsRequired: string
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
    /** Sign-in only: the "forgot password" action drawn beside the label of the field. */
    readonly onForgot: (() => void) | undefined
}

/** The label row of the sign-in password field: the label and, beside it, the way to a reset. */
const PasswordLabelRow = (props: { readonly labels: AuthDetailsLabels; readonly onForgot: () => void }) => (
    <Cluster gap="inline" justify="between">
        <Text>{props.labels.password}</Text>
        <TextAction appearance="inline" onPress={props.onForgot}>
            {props.labels.forgotLink}
        </TextAction>
    </Cluster>
)

/** The password field: a new password with its rule hint on sign-up, the current one otherwise. */
const PasswordField = (props: PasswordFieldProps) => (
    <Stack gap="identity">
        {props.onForgot === undefined ? null : <PasswordLabelRow labels={props.labels} onForgot={props.onForgot} />}
        <Input
            id="auth-password"
            name="password"
            label={props.labels.password}
            isLabelHidden={props.onForgot !== undefined}
            placeholder={props.labels.passwordPlaceholder}
            kind={props.isSignUp ? "newPassword" : "password"}
            description={props.isSignUp ? props.labels.passwordHint : undefined}
            revealLabel={props.labels.reveal}
            hideLabel={props.labels.hide}
            isRequired
            isInvalid={props.isInvalid}
            errorMessage={props.error}
        />
    </Stack>
)

/** What the credential fields need: the whole form but its submit and pending flag. */
type FieldsProps = Omit<AuthDetailsFormProps, "onSubmit" | "isPending">

/** The credential fields of the shape: email and password, email and password pair with terms, or the email alone. */
const Fields = (props: FieldsProps) => {
    const isSignUp = props.shape === "signUp"
    return (
        <>
            <Input
                id="auth-email"
                name="email"
                label={props.labels.email}
                placeholder={props.labels.emailPlaceholder}
                kind="email"
                // Sign-in draws its password label itself (the reset link beside it), so neither field marks required there; the submit checks the address.
                isRequired={props.shape !== "signIn"}
                isInvalid={props.emailError !== undefined}
                errorMessage={props.emailError}
            />
            {props.shape === "forgot" ? null : (
                <PasswordField
                    labels={props.labels}
                    isSignUp={isSignUp}
                    isInvalid={props.passwordError !== undefined || props.isRefused}
                    error={props.passwordError}
                    onForgot={props.shape === "signIn" ? props.onForgot : undefined}
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
                {...(props.shape === "signUp" && !props.isTermsAccepted
                    ? { disabledReason: props.labels.termsRequired }
                    : {})}
            >
                {props.labels.submit}
            </Button>
        </Stack>
    </Form>
)
