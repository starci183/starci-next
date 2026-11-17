"use client"

import { useHarnessBuildsScreen } from "@/hooks/harnessBuild"
import { HarnessBuildsBase } from "./component"

/** The connected list of builds of part 1: reads the catalog and hands the resolved screen to the presentational block. */
export const HarnessBuilds = () => {
    const screen = useHarnessBuildsScreen()
    return <HarnessBuildsBase props={screen.props} on={screen.on} />
}
