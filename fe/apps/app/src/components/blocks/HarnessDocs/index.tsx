"use client"

import { useHarnessDocsScreen } from "@/hooks/harnessDocs"
import { HarnessDocsBase } from "./component"

/** The connected list of articles of part 3: reads the catalog and hands the resolved screen to the presentational block. */
export const HarnessDocs = () => {
    const screen = useHarnessDocsScreen()
    return <HarnessDocsBase props={screen.props} on={screen.on} />
}
