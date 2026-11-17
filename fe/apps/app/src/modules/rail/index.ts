const RAIL_KEY = "starci-next.rail.collapsed"

const listeners = new Set<() => void>()

/** Whether the reader collapsed the sidebar rail; expanded without a stored choice or when the browser refuses storage. */
export const railCollapsedOf = (): boolean => {
    try {
        return window.localStorage.getItem(RAIL_KEY) === "1"
    } catch {
        return false
    }
}

/** Remembers the rail choice and tells every reader; a browser that refuses storage keeps the old answer. */
export const rememberRailCollapsed = (collapsed: boolean): void => {
    try {
        window.localStorage.setItem(RAIL_KEY, collapsed ? "1" : "0")
    } catch {
        return
    }
    listeners.forEach((listener) => listener())
}

/** Calls `onChange` after every remembered choice; answers the function that stops listening. */
export const subscribeRailCollapsed = (onChange: () => void): (() => void) => {
    listeners.add(onChange)
    return () => listeners.delete(onChange)
}
