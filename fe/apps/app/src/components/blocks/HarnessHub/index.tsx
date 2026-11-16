"use client"

import { useHarnessHubScreen } from "@/hooks/harness"
import { HarnessHubBase } from "./component"

/** The connected harness hub: reads the area's catalog and the learner's tool, and hands the resolved screen to the presentational block. */
export const HarnessHub = () => {
    const screen = useHarnessHubScreen()
    return <HarnessHubBase props={screen.props} on={screen.on} />
}
