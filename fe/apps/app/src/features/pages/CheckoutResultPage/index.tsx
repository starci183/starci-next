import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { CheckoutResultPageBase } from "./component"
import type { ReactElement } from "react"

/** The document title of the checkout result page, from the catalog of the requested locale. */
export const checkoutResultMetadata = async (): Promise<Metadata> => {
    const t = await getTranslations("app.checkoutResult")
    return { title: t("title") }
}

/** What the route hands the result page: the raw `order` query value the return address left, if any. */
type CheckoutResultPageProps = { readonly order: string | ReadonlyArray<string> | undefined }

/** The order id the address names: the first non-empty `order` value, otherwise none. */
const orderIdOf = (order: string | ReadonlyArray<string> | undefined): string | undefined => {
    const value = typeof order === "string" ? order : order?.[0]
    return value === undefined || value === "" ? undefined : value
}

/** The checkout result page: a server owner that mounts the result block for the named order; the address carries no verdict. */
export const CheckoutResultPage = (props: CheckoutResultPageProps): ReactElement => (
    <CheckoutResultPageBase props={{ orderId: orderIdOf(props.order) }} />
)
