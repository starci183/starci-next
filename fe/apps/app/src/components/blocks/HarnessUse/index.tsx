"use client"

import { useHarnessUseScreen } from "@/hooks/harnessUse"
import { HarnessUseBase } from "./component"

/** The connected part 2: reads the catalog for the learner's tool and hands the resolved screen to the presentational block. */
export const HarnessUse = () => {
    const screen = useHarnessUseScreen()
    return <HarnessUseBase props={screen.props} on={screen.on} />
}
