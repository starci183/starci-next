import { AuthPanel, type AuthPanelProps } from "@/components/blocks/AuthPanel"

/** Props for {@link SignInPageBase}. */
export type SignInPageBaseProps = {
    /** Where the card starts, the notice the route brought and where a finished sign-in goes. */
    readonly props: Pick<AuthPanelProps, "destination" | "notice" | "returnTo">
}

/** The sign-in surface of the product identity boundary (ui.identity.sign-in): the one card that holds sign-in, sign-up, password reset and the sent note, inside the entry frame of the layout. */
export const SignInPageBase = (props: SignInPageBaseProps) => (
    <AuthPanel
        mode="signIn"
        notice={props.props.notice}
        destination={props.props.destination}
        returnTo={props.props.returnTo}
        presentation="page"
    />
)
