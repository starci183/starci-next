import { Page } from "@starci/grammar/common"
import { CheckoutResult } from "@/components/blocks/CheckoutResult"
import { CENTER_CLASS_NAME } from "./classNames"

/** Props for {@link CheckoutResultPageBase}. */
export type CheckoutResultPageBaseProps = {
    /** The order the return address names. */
    readonly props: { readonly orderId: string | undefined }
}

/** Draws the checkout result route: one Page with no header band and the result card centred, as the sign-in surface does. */
export const CheckoutResultPageBase = (props: CheckoutResultPageBaseProps) => (
    <Page>
        <div className={CENTER_CLASS_NAME}>
            <CheckoutResult orderId={props.props.orderId} />
        </div>
    </Page>
)
