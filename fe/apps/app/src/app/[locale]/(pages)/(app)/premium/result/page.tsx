import { CheckoutResultPage } from "@/features/pages/CheckoutResultPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { checkoutResultMetadata as generateMetadata } from "@/features/pages/CheckoutResultPage"

/** The result route's framework inputs: the query the payment gateway's return address left. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale's checkout result slot: it passes the `order` query value on and nothing else; any `result` hint is ignored. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { order } = await props.searchParams
    return <CheckoutResultPage order={order} />
}

export default Page
