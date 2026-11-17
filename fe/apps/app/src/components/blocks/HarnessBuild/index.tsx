"use client"

import { useHarnessBuildScreen } from "@/hooks/harnessBuild"
import { HarnessBuildBase } from "./component"

/** What the route hands the build block: the build in the address and the raw `stage` query, both atoms. */
type HarnessBuildProps = {
    readonly buildId: string
    readonly stage: string | undefined
}

/**
 * The connected build page: reads the build (the stage results follow the learner's machine live) and hands the resolved screen
 * to the presentational block.
 */
export const HarnessBuild = (props: HarnessBuildProps) => {
    const screen = useHarnessBuildScreen(props)
    return <HarnessBuildBase props={screen.props} on={screen.on} />
}
