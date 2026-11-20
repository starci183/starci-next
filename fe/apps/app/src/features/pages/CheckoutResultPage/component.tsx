import { CheckoutResult } from "@/components/blocks/CheckoutResult"

/** Props for {@link CheckoutResultPageBase}. */
export type CheckoutResultPageBaseProps = {
    /** The order the return address names. */
    readonly props: { readonly orderId: string | undefined }
}

/** Draws the checkout result route: the result block, which owns its Page and header band. */
export const CheckoutResultPageBase = (props: CheckoutResultPageBaseProps) => (
    <CheckoutResult orderId={props.props.orderId} />
)
