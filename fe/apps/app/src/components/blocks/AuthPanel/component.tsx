import { Alert, Cluster, Heading, RelativeTime, Stack, SurfaceCard, Text, TextAction } from "@starci/grammar/common"
import type { AuthNoticeTone, AuthRetry } from "@/modules/types"
import {
    AuthCodeForm,
    AuthDetailsForm,
    AuthSocialButtons,
    type AuthCodeLabels,
    type AuthDetailsLabels,
    type AuthSocialProvider,
} from "@starci-next/ui"

/** The drawings of the card, in the order the owner approved them: the three detail forms and the emailed code step. */
export const AUTH_PANEL_SHAPES = ["signIn", "signUp", "forgot", "code"] as const

/** One drawing of the sign-in card. */
export type AuthPanelShape = (typeof AUTH_PANEL_SHAPES)[number]

/** Props for {@link AuthPanelBase}. */
export interface AuthPanelBaseProps {
    readonly shape: AuthPanelShape
    readonly props: {
        readonly title: string
        readonly subtitle: string
        readonly notice: { readonly tone: AuthNoticeTone; readonly title: string } | undefined
        /** True when the social buttons and their divider are drawn (the sign-in and sign-up details). */
        readonly hasSocial: boolean
        readonly social: {
            readonly facebookLabel: string
            readonly githubLabel: string
            readonly dividerLabel: string
            readonly pendingProvider: AuthSocialProvider | undefined
            readonly pendingLabel: string
        }
        readonly details: AuthDetailsLabels
        readonly code: AuthCodeLabels
        /** True inside the sign-in modal: the dialog is the surface, so the card and its page-level heading are not drawn. */
        readonly isEmbedded: boolean
        /** The countdown of a rate-limited answer, drawn under the notice; undefined when none runs. */
        readonly retry: AuthRetry | undefined
        readonly isReset: boolean
        readonly isPending: boolean
        readonly isTermsAccepted: boolean
        readonly isRefused: boolean
        readonly emailError: string | undefined
        readonly passwordError: string | undefined
        readonly confirmError: string | undefined
        readonly codeError: string | undefined
        readonly promptQuestion: string
        readonly promptAction: string
    }
    readonly on: {
        readonly submitDetails: (input: FormData) => void
        readonly submitCode: (input: FormData) => void
        readonly codeChange: () => void
        readonly resend: () => void
        readonly anotherEmail: () => void
        readonly forgot: () => void
        readonly terms: (isAccepted: boolean) => void
        readonly social: (provider: AuthSocialProvider) => void
        readonly prompt: () => void
    }
}

/** The form of the shape: the emailed code step, or the details form of the mode. */
const Body = (props: AuthPanelBaseProps) => {
    switch (props.shape) {
        case "code":
            return (
                <AuthCodeForm
                    labels={props.props.code}
                    isReset={props.props.isReset}
                    isPending={props.props.isPending}
                    codeError={props.props.codeError}
                    passwordError={props.props.passwordError}
                    confirmError={props.props.confirmError}
                    onSubmit={props.on.submitCode}
                    onCodeChange={props.on.codeChange}
                    onResend={props.on.resend}
                    onAnotherEmail={props.on.anotherEmail}
                />
            )
        case "signIn":
        case "signUp":
        case "forgot":
            return (
                <AuthDetailsForm
                    shape={props.shape}
                    labels={props.props.details}
                    isPending={props.props.isPending}
                    isTermsAccepted={props.props.isTermsAccepted}
                    isRefused={props.props.isRefused}
                    emailError={props.props.emailError}
                    passwordError={props.props.passwordError}
                    confirmError={props.props.confirmError}
                    onSubmit={props.on.submitDetails}
                    onTermsChange={props.on.terms}
                    onForgot={props.on.forgot}
                />
            )
    }
}

/** The card's content: the title, the support line, the one notice, the social buttons, the form of its shape and the line that switches mode. */
const Content = (props: AuthPanelBaseProps) => (
    <Stack gap="section">
        <Stack gap="identity">
            <Heading level={props.props.isEmbedded ? 2 : 1} scale="title">
                {props.props.title}
            </Heading>
            <Text tone="muted">{props.props.subtitle}</Text>
        </Stack>
        {props.props.notice === undefined ? null : (
            <Alert tone={props.props.notice.tone} title={props.props.notice.title} />
        )}
        {props.props.retry === undefined ? null : (
            <RelativeTime
                mode="countdown"
                format="digital"
                dateTime={props.props.retry.until}
                locale={props.props.retry.locale}
                template={props.props.retry.template}
                expiredLabel={props.props.retry.expired}
                size="sm"
                tone="muted"
            />
        )}
        {props.props.hasSocial ? (
            <AuthSocialButtons {...props.props.social} isDisabled={props.props.isPending} onChoose={props.on.social} />
        ) : null}
        <Body {...props} />
        <Cluster gap="inline" justify="center">
            <Text size="sm" tone="muted">
                {props.props.promptQuestion}
            </Text>
            <TextAction onPress={props.on.prompt}>{props.props.promptAction}</TextAction>
        </Cluster>
    </Stack>
)

/**
 * The sign-in card of ui.identity.sign-in: one `SurfaceCard measure="formCompact"` around its content on the sign-in page, the
 * content alone inside the sign-in modal (the dialog is its surface).
 */
export const AuthPanelBase = (props: AuthPanelBaseProps) =>
    props.props.isEmbedded ? (
        <Content {...props} />
    ) : (
        <SurfaceCard ariaLabel={props.props.title} measure="formCompact">
            <Content {...props} />
        </SurfaceCard>
    )
