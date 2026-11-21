import { Alert, Button, Spinner, Stack, SurfaceCard } from "@starci/grammar/common"
import type { ReactNode } from "react"
import { AuthCardHeading, AuthLinkNotice } from "@starci-next/ui"

/** Props for {@link ConfirmEmailBase}. */
export interface ConfirmEmailBaseProps {
    readonly props: {
        readonly title: string
        readonly text: string
        /** The picture of the outcome (the milestone art once confirmed, the welcome art on a dead link). */
        readonly art: ReactNode
        /** True while the emailed link is being spent: the spinner is drawn and no action. */
        readonly isWorking: boolean
        /** The notice under the text when the back end could not be reached, or undefined. */
        readonly failureTitle: string | undefined
        readonly signInLabel: string
        readonly signInHref: string
        /** Set when the link is dead: the expired-link card (its three facts) replaces the plain outcome. */
        readonly expiredFacts: { readonly once: string; readonly expires: string; readonly again: string } | undefined
    }
}

/** The card the emailed confirmation link opens: what the link came to in words, and the way on to sign in. */
export const ConfirmEmailBase = (props: ConfirmEmailBaseProps) => (
    <SurfaceCard ariaLabel={props.props.title} measure="formCompact">
        {props.props.expiredFacts !== undefined ? (
            <AuthLinkNotice
                art={props.props.art}
                title={props.props.title}
                text={props.props.text}
                facts={props.props.expiredFacts}
                actionLabel={props.props.signInLabel}
                actionHref={props.props.signInHref}
            />
        ) : (
            <Stack gap="section">
                {props.props.art}
                <AuthCardHeading title={props.props.title} subtitle={props.props.text} level={1} />
                {props.props.isWorking ? <Spinner label={props.props.text} /> : null}
                {props.props.failureTitle === undefined ? null : (
                    <Alert tone="negative" title={props.props.failureTitle} />
                )}
                {props.props.isWorking ? null : (
                    <Button intent="commit" width="fill" href={props.props.signInHref}>
                        {props.props.signInLabel}
                    </Button>
                )}
            </Stack>
        )}
    </SurfaceCard>
)
