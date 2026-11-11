import { randomUUID } from "node:crypto"
import type { Ids } from "./ids.port"

/** The production ids: the one place that reads the ambient random source. It has no dependencies, so the DI container builds it without a decorator. */
export class SystemIdsService implements Ids {
    /** A fresh random UUID. */
    next(): string {
        return randomUUID()
    }
}
