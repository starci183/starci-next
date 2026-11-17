import { Page } from "@starci/grammar/common"
import { SocialCallbackStatus, type SocialCallbackStatusProps } from "@/components/blocks/SocialCallbackStatus"

/** Props for {@link SignInCallbackPageBase}. */
export type SignInCallbackPageBaseProps = {
    /** What the status block needs to finish the social sign-in. */
    readonly props: SocialCallbackStatusProps
}

/** The page the identity provider returns to: one Page that holds the sign-in progress and nothing else. */
export const SignInCallbackPageBase = (props: SignInCallbackPageBaseProps) => (
    <Page>
        <SocialCallbackStatus {...props.props} />
    </Page>
)
