import { HARNESS_TOOLS, type HarnessTool } from "@/modules/types"

/** The tool a learner who never chose one reads the guides of. */
export const DEFAULT_HARNESS_TOOL: HarnessTool = "claude"

/** The browser's local storage, or null where there is none (server render, storage blocked by the browser). */
const localStorageOrNull = (): Storage | null => {
    if (typeof window === "undefined") return null
    try {
        return window.localStorage
    } catch {
        return null
    }
}

/** The key the tool choice of one learner is kept under; a learner who is not known yet shares the anonymous key. */
const keyOf = (owner: string | null | undefined): string => `starci.harness.tool.${owner ?? "anonymous"}`

/** The listeners of this tab: the `storage` event fires only in the other tabs, so a choice here tells them itself. */
const listeners = new Set<() => void>()

/** The tool a learner chose before, or the default when none was chosen or the browser keeps nothing. */
export const readHarnessTool = (owner: string | null | undefined): HarnessTool => {
    const storage = localStorageOrNull()
    if (storage === null) return DEFAULT_HARNESS_TOOL
    try {
        const raw = storage.getItem(keyOf(owner))
        return HARNESS_TOOLS.find((each) => each === raw) ?? DEFAULT_HARNESS_TOOL
    } catch {
        return DEFAULT_HARNESS_TOOL
    }
}

/** Keeps the choice of one learner for the next visit and tells every listener; the page works without storage. */
export const writeHarnessTool = (owner: string | null | undefined, tool: HarnessTool): void => {
    const storage = localStorageOrNull()
    if (storage !== null) {
        try {
            storage.setItem(keyOf(owner), tool)
        } catch {
            // The browser keeps nothing: the choice lasts until the next read of an empty store.
        }
    }
    listeners.forEach((listener) => listener())
}

/** Subscribes to changes of the choice, in this tab and in the others; answers how to stop. */
export const subscribeHarnessTool = (listener: () => void): (() => void) => {
    listeners.add(listener)
    if (typeof window !== "undefined") window.addEventListener("storage", listener)
    return () => {
        listeners.delete(listener)
        if (typeof window !== "undefined") window.removeEventListener("storage", listener)
    }
}
