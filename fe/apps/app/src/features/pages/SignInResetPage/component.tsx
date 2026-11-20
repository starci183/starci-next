import { ResetPassword } from "@/components/blocks/ResetPassword"

/** Props for {@link SignInResetPageBase}. */
export type SignInResetPageBaseProps = {
    readonly props: {
        /** The token the emailed link carried, when it carried one. */
        readonly token: string | undefined
        readonly signInHref: string
        /** The sign-in screen with the "password was reset" notice. */
        readonly doneHref: string
    }
}

/** The page the emailed reset link opens: the card that sets the new password, inside the entry frame of the layout. */
export const SignInResetPageBase = (props: SignInResetPageBaseProps) => (
    <ResetPassword token={props.props.token} doneHref={props.props.doneHref} signInHref={props.props.signInHref} />
)
