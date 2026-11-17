"use client"

import { usePracticePatternScreen } from "@/hooks/practice"
import { PracticePatternBase } from "./component"

/** What the route hands the pattern block: the segment of the address. */
type PracticePatternProps = { readonly patternId: string }

/** The connected pattern screen: reads the pattern with its problems and hands the resolved screen to the presentational block. */
export const PracticePattern = (props: PracticePatternProps) => {
    const screen = usePracticePatternScreen(props.patternId)
    return <PracticePatternBase props={screen.props} on={screen.on} />
}
