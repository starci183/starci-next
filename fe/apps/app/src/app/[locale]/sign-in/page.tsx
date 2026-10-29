import { SignInPage } from "@/features/pages/SignInPage"

/** The document title of this page, from the catalog of the requested locale. */
export { signInMetadata as generateMetadata } from "@/features/pages/SignInPage"

/** The sign-in route's framework inputs: the query the identity callback's final redirect may have settled. */
type PageProps = {
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The locale's sign-in slot: it mounts the product identity sign-in page and nothing else. */
const Page = async (props: PageProps) => {
    const { auth } = await props.searchParams
    return <SignInPage authOutcome={auth} />
}

export default Page
