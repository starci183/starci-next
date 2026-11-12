"use client"

import { createContext, type Context, type ReactNode } from "react"
import type { SimulationProgress } from "../SimulationCard/types"

/** Where a simulation's progress goes: the activity it belongs to and the walk so far. */
type WalkReport = (activityId: string, progress: SimulationProgress) => void

/** What the connected block hands the walk channel: where progress goes, and the tree below that reports it (`content`). */
type WalkProviderProps = { readonly onWalk: WalkReport; readonly content: ReactNode }

/** The channel a simulation card reports through; a card outside a provider reports to nobody. */
export const WalkContext: Context<WalkReport> = createContext<WalkReport>(() => undefined)

/** The client-side channel a simulation reports its walk through: the connected block provides it once, so no function crosses a server file. */
export const WalkProvider = (props: WalkProviderProps) => (
    <WalkContext.Provider value={props.onWalk}>{props.content}</WalkContext.Provider>
)
