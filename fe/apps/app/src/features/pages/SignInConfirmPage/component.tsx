import { Cluster, Page, Stack } from "@starci/grammar/common"
import { BrandLockup } from "@starci-next/ui"
import { ConfirmEmail } from "@/components/blocks/ConfirmEmail"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { CENTER_CLASS_NAME } from "./classNames"

/** Props for {@link SignInConfirmPageBase}. */
export type SignInConfirmPageBaseProps = {
    readonly props: {
        /** The token the emailed link carried, when it carried one. */
        readonly token: string | undefined
        readonly brand: string
        readonly logoSrc: string
        readonly homeHref: string
        readonly signInHref: string
    }
}

/** The page the emailed confirmation link opens: the brand lockup centred above the card that spends the token. */
export const SignInConfirmPageBase = (props: SignInConfirmPageBaseProps) => (
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
                <ConfirmEmail token={props.props.token} signInHref={props.props.signInHref} />
            </div>
        </Stack>
    </Page>
)
