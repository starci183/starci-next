import { Alert, Button, Form, Heading, Page, SurfaceCard, Text } from "@starci/grammar/common"

/** The fixed outcomes the identity session callback's final redirect reports (contract.identity.session-contract). */
export type SignInOutcome = "failed" | "signed-in"

/** Props for {@link SignInPageBase}. */
export type SignInPageBaseProps = {
    /** The resolved copy, the session door, the continuation destination and the callback outcome, if one was consumed. */
    readonly props: {
        /** The page heading and the accessible name of the card and form landmarks. */
        readonly title: string
        /** The support line under the heading. */
        readonly support: string
        /** The sign-in action's label. */
        readonly signInLabel: string
        /** The continuation action's label for a settled reader. */
        readonly continueLabel: string
        /** What the failure report is called. */
        readonly failureTitle: string
        /** What the failure report tells the reader to do. */
        readonly failureDescription: string
        /** What the settled report tells the reader. */
        readonly settledTitle: string
        /** The application-owned session door the form posts to: the start of the provider handshake. */
        readonly signInDoor: string
        /** The authenticated reader's way onward, a locale-aware destination. */
        readonly continueHref: string
        /** The outcome the callback's final redirect reported, when one was consumed. */
        readonly outcome: SignInOutcome | undefined
    }
}

/**
 * The sign-in surface of the product identity boundary (ui.identity.sign-in): one Page with no header band, one
 * horizontally centred `SurfaceCard measure="formCompact"`, one single-column form that the browser posts to the
 * session's start door — the `303` it answers is the provider handshake, which only a browser navigation may follow —
 * and the one commit the outcome leaves: the sign-in submit, or the onward destination once the session is settled.
 * No credential fields: the contract carries no credentials through the app, and no provider detail is ever shown.
 */
export const SignInPageBase = (props: SignInPageBaseProps) => (
    <Page>
        <div className="flex min-w-0 justify-center">
            <SurfaceCard ariaLabel={props.props.title} measure="formCompact">
                <Form label={props.props.title} action={props.props.signInDoor} method="post">
                    <Heading level={1}>{props.props.title}</Heading>
                    <Text size="sm" tone="muted">
                        {props.props.support}
                    </Text>
                    {props.props.outcome === "failed" ? (
                        <Alert
                            tone="negative"
                            appearance="soft"
                            title={props.props.failureTitle}
                            description={props.props.failureDescription}
                        />
                    ) : null}
                    {props.props.outcome === "signed-in" ? (
                        <Alert tone="affirmative" appearance="soft" title={props.props.settledTitle} />
                    ) : null}
                    {props.props.outcome === "signed-in" ? (
                        <Button intent="commit" width="fill" href={props.props.continueHref}>
                            {props.props.continueLabel}
                        </Button>
                    ) : (
                        <Button type="submit" intent="commit" width="fill">
                            {props.props.signInLabel}
                        </Button>
                    )}
                </Form>
            </SurfaceCard>
        </div>
    </Page>
)
