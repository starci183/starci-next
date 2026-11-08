import { isForbidden } from "@/modules/failure"
import type { DataSlot, SlotRead } from "@/modules/types"

/** A slot whose data has not arrived: the same tree draws as a skeleton. */
export const loadingSlot = <T>(): DataSlot<T> => ({ isLoading: true })

/** Keeps an empty collection explicit while a refresh stays beside settled content. */
const slotOfItems = <T>(items: T, isValidating: boolean | undefined): DataSlot<T> => {
    const validation = isValidating === undefined ? {} : { isValidating }
    return Array.isArray(items) && items.length === 0 ? { isEmpty: true, ...validation } : { items, ...validation }
}

/** Carries a slot's status over to what is made of its items, so a block words its data without touching the status. */
export const mapSlot = <T, U>(slot: DataSlot<T>, map: (items: T) => U): DataSlot<U> => {
    if ("items" in slot) return slotOfItems(map(slot.items), slot.isValidating)
    return slot
}

/** A failed read: forbidden when the stable code or kind says the reader may not see it (Premium required), an error otherwise. */
const failedSlot = <T>(error: unknown): DataSlot<T> => (isForbidden(error) ? { isForbidden: true } : { isError: true })

/**
 * Folds the state of one SWR read into a slot: the items once they arrived, a failure when the read failed, loading only while a
 * read is really in flight, else empty. A read that does not fetch is therefore empty, never an endless skeleton.
 */
export const slotOfSwr = <T>(read: SlotRead<T>): DataSlot<T> => {
    if (read.data !== undefined) return slotOfItems(read.data, read.isValidating)
    if (read.error !== undefined) return failedSlot(read.error)
    return read.isLoading ? loadingSlot() : { isEmpty: true }
}
