"use client"

import { useHarnessGuideScreen } from "@/hooks/harnessUse"
import { HarnessGuideBase } from "./component"

/** What the route hands the guide block: the guide in the address, an atom. */
type HarnessGuideProps = { readonly slug: string }

/**
 * The connected guide page: reads the guide and the newest `harness doctor` result of its tool, and hands the resolved screen to
 * the presentational block.
 */
export const HarnessGuide = (props: HarnessGuideProps) => {
    const screen = useHarnessGuideScreen(props)
    return <HarnessGuideBase props={screen.props} on={screen.on} />
}
