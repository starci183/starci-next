/** The part of a node-postgres pool the guard wraps: `connect` in its callback form (TypeORM's) and its promise form. */
interface GuardedPool {
    connect: (...args: Array<unknown>) => unknown
}

/** Marks an error as transient for whoever classifies it by `failureClass` (a job runner, a retry), once; an error that already says its class keeps it. */
const markTransient = (error: unknown): unknown => {
    if (error instanceof Error && Reflect.get(error, "failureClass") === undefined) {
        Object.defineProperty(error, "failureClass", { value: "transient", configurable: true, enumerable: false })
    }
    return error
}

/**
 * Makes a pool that cannot hand out a connection fail RETRYABLE: the wait for a free connection that ran out (`connectionTimeoutMillis`), a database that is down or
 * refuses connections, a connection that ended while it was being made. These are plain errors without a code, so nothing downstream could tell them from a defect;
 * the pool is the one place that knows they are the pool failing, and says so with the `failureClass` every consumer already reads.
 */
export const guardPool = (pool: GuardedPool): void => {
    const connect = pool.connect.bind(pool)
    pool.connect = (...args: Array<unknown>): unknown => {
        const callback = args[0]
        if (typeof callback === "function") {
            return connect((error: unknown, ...rest: Array<unknown>) =>
                (callback as (...given: Array<unknown>) => unknown)(
                    error === undefined || error === null ? error : markTransient(error),
                    ...rest,
                ),
            )
        }
        return (connect(...args) as Promise<unknown>).catch((error: unknown) => {
            throw markTransient(error)
        })
    }
}
