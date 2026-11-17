"use client"

import { useHarnessDocScreen } from "@/hooks/harnessDocs"
import { HarnessDocBase } from "./component"

/** What the route hands the article block: the article in the address, an atom. */
type HarnessDocProps = { readonly slug: string }

/** The connected article page: reads the article and hands the resolved screen to the presentational block. */
export const HarnessDoc = (props: HarnessDocProps) => {
    const screen = useHarnessDocScreen(props)
    return <HarnessDocBase props={screen.props} on={screen.on} />
}
