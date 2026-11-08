/** One field the payment gateway's form expects. */
interface CheckoutField {
    readonly name: string
    readonly value: string
}

/** Where the browser goes to pay: a GET to the url, or a top-level form POST of the fields to it. */
interface CheckoutDestination {
    readonly method: string
    readonly url: string
    readonly fields: ReadonlyArray<CheckoutField>
}

/**
 * The hosts each kind of gateway destination may point at: the SePay signed form posts to SePay's payment host (live or
 * sandbox), and the payOS hosted link is a GET to a payOS host. Anything else is refused rather than followed.
 */
const POST_HOSTS: ReadonlySet<string> = new Set(["pay.sepay.vn", "pay-sandbox.sepay.vn"])
const GET_HOSTS: ReadonlySet<string> = new Set(["pay.payos.vn"])
const GET_HOST_SUFFIX = ".payos.vn"

/** True when the destination is an https address on a host of its method's gateway. */
const isGatewayAddress = (url: string, post: boolean): boolean => {
    if (!URL.canParse(url)) return false
    const { protocol, hostname } = new URL(url)
    if (protocol !== "https:") return false
    if (post) return POST_HOSTS.has(hostname)
    return GET_HOSTS.has(hostname) || hostname.endsWith(GET_HOST_SUFFIX)
}

/**
 * Sends the browser to the payment gateway the server chose. A POST destination (SePay) is a native top-level form
 * submission of the fields, which no XHR can perform; a GET destination (payOS) is a plain navigation. Answers false when the
 * destination cannot be followed (not an https address on its gateway's host, or no document), and true once the browser
 * is leaving.
 */
export const leaveForCheckout = (destination: CheckoutDestination): boolean => {
    const post = destination.method.toUpperCase() === "POST"
    if (typeof document === "undefined" || !isGatewayAddress(destination.url, post)) return false
    if (!post) {
        window.location.assign(destination.url)
        return true
    }
    const form = document.createElement("form")
    form.method = "post"
    form.action = destination.url
    for (const field of destination.fields) {
        const input = document.createElement("input")
        input.type = "hidden"
        input.name = field.name
        input.value = field.value
        form.appendChild(input)
    }
    document.body.appendChild(form)
    form.submit()
    return true
}
