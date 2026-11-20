import { isRecord } from "@modules/platform/primitives"

/** SQLSTATE class 55, "object not in prerequisite state": a lock that was not granted in time, an object a running job still holds. */
const OBJECT_NOT_AVAILABLE_CLASS = "55"

const sqlStateOf = (cause: unknown): string => {
    if (!isRecord(cause)) return ""
    const own = cause["code"]
    if (typeof own === "string") return own
    const driver = cause["driverError"]
    return isRecord(driver) && typeof driver["code"] === "string" ? driver["code"] : ""
}

/**
 * True when a database refused because something else holds what the statement needs (a `lock_timeout` ran out, a function refuses while a
 * job still runs): the driver error is judged by its SQLSTATE class, never by one code or by its message. The caller turns it into an error
 * that carries its own `failureClass`; this does not classify the failure.
 */
export const isObjectBusy = (cause: unknown): boolean => sqlStateOf(cause).startsWith(OBJECT_NOT_AVAILABLE_CLASS)
