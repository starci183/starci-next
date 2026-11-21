import { ConfirmEmail } from "@/components/blocks/ConfirmEmail"

/** Props for {@link SignInConfirmPageBase}. */
export type SignInConfirmPageBaseProps = {
    readonly props: {
        /** The token the emailed link carried, when it carried one. */
        readonly token: string | undefined
        readonly signInHref: string
    }
}

/** The page the emailed confirmation link opens: the card that spends the token, inside the entry frame of the layout. */
export const SignInConfirmPageBase = (props: SignInConfirmPageBaseProps) => (
    <ConfirmEmail token={props.props.token} signInHref={props.props.signInHref} />
)
