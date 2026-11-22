import { Alert, Button, Cluster, Stack, SurfaceCard, Text, TextAction } from "@starci/grammar/common"
import type { ReactNode } from "react"
import type { AuthNoticeView } from "@/modules/types"
import {
    AuthCardHeading,
    AuthDetailsForm,
    AuthSentSteps,
    AuthSocialButtons,
    type AuthDetailsLabels,
} from "@starci-next/ui"

/** The drawings of the card: the three detail forms and the note that the emailed link was sent. */
export const AUTH_PANEL_SHAPES = ["signIn", "signUp", "forgot", "sent"] as const

/** One drawing of the sign-in card. */
export type AuthPanelShape = (typeof AUTH_PANEL_SHAPES)[number]

/** Props for {@link AuthPanelBase}. */
export interface AuthPanelBaseProps {
    readonly shape: AuthPanelShape
    readonly props: {
        readonly title: string
        /** The support line; on the sent note it sets the address strong. */
        readonly subtitle: ReactNode
        readonly notice: AuthNoticeView | undefined
        /** True when the social buttons and their divider are drawn (the sign-in and sign-up details). */
        readonly hasSocial: boolean
        readonly social: {
            readonly googleLabel: string
            readonly dividerLabel: string
            readonly isPending: boolean
            readonly pendingLabel: string
        }
        readonly details: AuthDetailsLabels
        readonly sent: {
            readonly resend: string
            /** The resend label while the cool-down runs (it carries the time left), or undefined once the resend is open. */
            readonly resendWait: string | undefined
            readonly stepsLabel: string
            readonly steps: { readonly sent: string; readonly open: string; readonly confirm: string }
            readonly anotherEmail: string
        }
        /** True inside the sign-in modal: the dialog is the surface, so the card and its page-level heading are not drawn. */
        readonly isEmbedded: boolean
        readonly isPending: boolean
        readonly isTermsAccepted: boolean
        readonly isRefused: boolean
        readonly emailError: string | undefined
        readonly passwordError: string | undefined
        readonly confirmError: string | undefined
        readonly promptQuestion: string
        readonly promptAction: string
    }
    readonly on: {
        readonly submitDetails: (input: FormData) => void
        readonly resend: () => void
        readonly anotherEmail: () => void
        readonly forgot: () => void
        readonly terms: (isAccepted: boolean) => void
        readonly social: () => void
        readonly prompt: () => void
    }
}

/** The form of the shape: the sent note with its resend and other-email actions, or the details form of the mode. */
const Body = (props: AuthPanelBaseProps) => {
    switch (props.shape) {
        case "sent":
            return (
                <Stack gap="row">
                    <AuthSentSteps label={props.props.sent.stepsLabel} steps={props.props.sent.steps} />
                    <Button
                        variant="border"
                        width="fill"
                        isPending={props.props.isPending}
                        isDisabled={props.props.sent.resendWait !== undefined}
                        onPress={props.on.resend}
                    >
                        {props.props.sent.resendWait ?? props.props.sent.resend}
                    </Button>
                    <Cluster gap="inline" justify="center">
                        <TextAction appearance="inline" onPress={props.on.anotherEmail}>
                            {props.props.sent.anotherEmail}
                        </TextAction>
                    </Cluster>
                </Stack>
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

/** The card's content: the title, the support line, the one notice, the social buttons, the form of its shape and, on a details form, the line that switches mode (the sent note has none, as on the board). */
const Content = (props: AuthPanelBaseProps) => (
    <Stack gap="section">
        <AuthCardHeading
            title={props.props.title}
            subtitle={props.props.subtitle}
            level={props.props.isEmbedded ? 2 : 1}
        />
        {props.props.notice === undefined ? null : (
            <Alert
                tone={props.props.notice.tone}
                title={props.props.notice.title}
                description={props.props.notice.description}
            />
        )}
        {props.props.hasSocial ? (
            <AuthSocialButtons {...props.props.social} isDisabled={props.props.isPending} onChoose={props.on.social} />
        ) : null}
        <Body {...props} />
        {props.shape === "sent" ? null : (
            <Cluster gap="inline" justify="center">
                <Text role="body" tone="muted">
                    {props.props.promptQuestion}
                </Text>
                <TextAction appearance="inline" onPress={props.on.prompt}>
                    {props.props.promptAction}
                </TextAction>
            </Cluster>
        )}
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
