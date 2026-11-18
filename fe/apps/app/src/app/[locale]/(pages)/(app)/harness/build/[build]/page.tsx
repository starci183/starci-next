import { HarnessBuildPage } from "@/features/pages/HarnessBuildPage"
import type { ReactElement } from "react"

/** The document title of this page, from the catalog of the requested locale. */
export { harnessBuildPageMetadata as generateMetadata } from "@/features/pages/HarnessBuildPage"

/** The build route's framework inputs: the build in the address and the query that names the stage. */
type PageProps = {
    readonly params: Promise<{ readonly build: string }>
    readonly searchParams: Promise<Readonly<Record<string, string | ReadonlyArray<string> | undefined>>>
}

/** The first value of a query parameter that may repeat. */
const firstOf = (value: string | ReadonlyArray<string> | undefined): string | undefined =>
    typeof value === "string" ? value : value?.[0]

/** The build slot: it hands the build id and the stage query to the build page and nothing else. */
const Page = async (props: PageProps): Promise<ReactElement> => {
    const { build } = await props.params
    const { stage } = await props.searchParams
    return <HarnessBuildPage buildId={build} stage={firstOf(stage)} />
}

export default Page
