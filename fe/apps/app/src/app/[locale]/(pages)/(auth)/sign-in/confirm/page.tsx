import { SignInConfirmPage } from "@/features/pages/SignInConfirmPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { signInConfirmMetadata as generateMetadata } from "@/features/pages/SignInConfirmPage"

/** The route inputs: the query that carries the token of the emailed confirmation link. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale confirm slot: it mounts the confirm page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { token } = await props.searchParams
    return <SignInConfirmPage token={token} />
}

export default Page
