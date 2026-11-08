import { SignInPage } from "@/features/pages/SignInPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { signInMetadata as generateMetadata } from "@/features/pages/SignInPage"

/** The sign-in route framework inputs: the query that asks for a return path or a one-off notice. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale sign-in slot: it mounts the product identity sign-in page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { returnTo, signedOut, error } = await props.searchParams
    return <SignInPage returnTo={returnTo} signedOut={signedOut} error={error} />
}

export default Page
