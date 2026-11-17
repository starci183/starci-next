"use client"

import { usePracticeSolveScreen } from "@/hooks/practice"
import { PracticeSolveBase } from "./component"

/** What the route hands the solve block: the problem in the address. */
type PracticeSolveProps = { readonly slug: string }

/** The connected solve screen of one problem: reads it, keeps the work of the learner and hands the resolved screen to the presentational block. */
export const PracticeSolve = (props: PracticeSolveProps) => {
    const screen = usePracticeSolveScreen(props.slug)
    return <PracticeSolveBase props={screen.props} on={screen.on} />
}
