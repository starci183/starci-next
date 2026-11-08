import { Cluster, Page, Stack } from "@starci/grammar/common"
import { BrandLockup } from "@starci-next/ui"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { AuthPanel, type AuthPanelProps } from "@/components/blocks/AuthPanel"
import { CENTER_CLASS_NAME } from "./classNames"

/** Props for {@link SignInPageBase}. */
export type SignInPageBaseProps = {
    /** Where the card starts, the notice the route brought and where a finished sign-in goes. */
    readonly props: Pick<AuthPanelProps, "destination" | "notice" | "returnTo"> & {
        /** The wordmark, the logo file and the front door the brand above the card shows. */
        readonly brand: string
        readonly logoSrc: string
        readonly homeHref: string
    }
}

/**
 * The sign-in surface of the product identity boundary (ui.identity.sign-in): one Page with no header band, the brand lockup
 * centred above one horizontally centred card that holds sign-in, sign-up, password reset and the emailed code step.
 */
export const SignInPageBase = (props: SignInPageBaseProps) => (
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
                <AuthPanel
                    mode="signIn"
                    notice={props.props.notice}
                    destination={props.props.destination}
                    returnTo={props.props.returnTo}
                    presentation="page"
                />
            </div>
        </Stack>
    </Page>
)
