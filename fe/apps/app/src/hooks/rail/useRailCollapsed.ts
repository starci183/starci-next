"use client"

import { useSyncExternalStore } from "react"
import { railCollapsedOf, rememberRailCollapsed, subscribeRailCollapsed } from "@/modules/rail"

/** The collapsed state of the sidebar rail and the command that changes it. */
type RailCollapse = {
    readonly isCollapsed: boolean
    readonly setCollapsed: (collapsed: boolean) => void
}

/** The rail's collapsed state, remembered in the browser; expanded on the server and until hydration. */
export const useRailCollapsed = (): RailCollapse => ({
    isCollapsed: useSyncExternalStore(subscribeRailCollapsed, railCollapsedOf, () => false),
    setCollapsed: rememberRailCollapsed,
})
