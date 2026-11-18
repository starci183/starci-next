import { SignInCallbackPage } from "@/features/pages/SignInCallbackPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { signInCallbackMetadata as generateMetadata } from "@/features/pages/SignInCallbackPage"

/** The callback route framework inputs: the code and state the provider returned through the identity provider. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale social sign-in callback slot: it mounts the callback page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { code, state } = await props.searchParams
    return <SignInCallbackPage code={code} state={state} />
}

export default Page
