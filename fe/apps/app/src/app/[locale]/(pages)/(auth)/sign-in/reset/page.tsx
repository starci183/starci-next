import { SignInResetPage } from "@/features/pages/SignInResetPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { signInResetMetadata as generateMetadata } from "@/features/pages/SignInResetPage"

/** The route inputs: the query that carries the token of the emailed reset link. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale reset slot: it mounts the reset page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { token } = await props.searchParams
    return <SignInResetPage token={token} />
}

export default Page
