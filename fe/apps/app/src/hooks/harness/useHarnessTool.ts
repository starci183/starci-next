"use client"

import { useCallback, useSyncExternalStore } from "react"
import { useViewerId } from "@/hooks/viewer"
import { DEFAULT_HARNESS_TOOL, readHarnessTool, subscribeHarnessTool, writeHarnessTool } from "@/modules/harness-tool"
import type { HarnessTool } from "@/modules/types"

/** The tool the learner reads the guides of and the command that changes it. */
type HarnessToolChoice = {
    readonly tool: HarnessTool
    readonly choose: (tool: HarnessTool) => void
}

/**
 * The tool picker of the harness area (Claude Code or Codex), remembered per learner in the browser. The server render and the
 * first paint show the default; the remembered tool replaces it once the browser has answered, without a reload.
 */
export const useHarnessTool = (): HarnessToolChoice => {
    const viewer = useViewerId()
    const owner = viewer ?? null
    const tool = useSyncExternalStore(
        subscribeHarnessTool,
        () => readHarnessTool(owner),
        () => DEFAULT_HARNESS_TOOL,
    )
    const choose = useCallback((next: HarnessTool) => writeHarnessTool(owner, next), [owner])
    return { tool, choose }
}
