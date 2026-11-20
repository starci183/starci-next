import { Cluster, Page, Stack } from "@starci/grammar/common"
import { BrandLockup } from "@starci-next/ui"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { ResetPassword } from "@/components/blocks/ResetPassword"
import { CENTER_CLASS_NAME } from "./classNames"

/** Props for {@link SignInResetPageBase}. */
export type SignInResetPageBaseProps = {
    readonly props: {
        /** The token the emailed link carried, when it carried one. */
        readonly token: string | undefined
        readonly brand: string
        readonly logoSrc: string
        readonly homeHref: string
        readonly signInHref: string
        /** The sign-in screen with the "password was reset" notice. */
        readonly doneHref: string
    }
}

/** The page the emailed reset link opens: the brand lockup centred above the card that sets the new password. */
export const SignInResetPageBase = (props: SignInResetPageBaseProps) => (
    <Page>
        <Stack gap="region">
            <Cluster gap="row" justify="end">
                <LocaleSwitch />
            </Cluster>
            <div className={CENTER_CLASS_NAME}>
                <BrandLockup
                    brand={props.props.brand}
                    logoSrc={props.props.logoSrc}
                    homeHref={props.props.homeHref}
                    size="entry"
                />
            </div>
            <div className={CENTER_CLASS_NAME}>
                <ResetPassword
                    token={props.props.token}
                    doneHref={props.props.doneHref}
                    signInHref={props.props.signInHref}
                />
            </div>
        </Stack>
    </Page>
)
