import { isIP } from "node:net"
import { isPublicAddress } from "@modules/integrations/probe"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"

/** The ports a probe may call: the web defaults and the usual application ports; every other port is refused. */
export const PROBE_PORTS: ReadonlyArray<number> = [80, 443, 3000, 5000, 8000, 8080, 8443]

const URL_MAX = 300
const PRIVATE_SUFFIXES: ReadonlyArray<string> = [
    ".localhost",
    ".local",
    ".internal",
    ".lan",
    ".home",
    ".corp",
    ".intranet",
]

const refused = (): ProjectError => new ProjectError({ code: ProjectErrorCode.TargetRefused })

const withoutTrailingSlashes = (path: string): string => {
    let end = path.length
    while (end > 0 && path[end - 1] === "/") end -= 1
    return path.slice(0, end)
}

/**
 * The base address a probe may call, from what a learner declared: public http or https only, no credentials, no internal host
 * name, no private or loopback IP literal, and a port from `PROBE_PORTS`. Query and fragment are dropped. A host name is checked
 * again against the address it resolves to when the probe connects, so a name that points inside is refused there.
 */
export const publicTargetOf = (raw: string): string => {
    const text = raw.trim()
    if (text === "" || text.length > URL_MAX) throw refused()
    let url: URL
    try {
        url = new URL(text)
    } catch (cause) {
        throw new ProjectError({ code: ProjectErrorCode.TargetRefused, cause })
    }
    const host = url.hostname.startsWith("[") ? url.hostname.slice(1, -1) : url.hostname.toLowerCase()
    const literal = isIP(host) !== 0
    const web = url.protocol === "http:" || url.protocol === "https:"
    const named =
        host !== "localhost" &&
        host.includes(".") &&
        !PRIVATE_SUFFIXES.some((suffix) => host.endsWith(suffix)) &&
        !host.endsWith(".")
    const portOk = url.port === "" || PROBE_PORTS.includes(Number(url.port))
    if (!web || url.username !== "" || url.password !== "" || !portOk || (literal ? !isPublicAddress(host) : !named)) {
        throw refused()
    }
    return `${url.origin}${withoutTrailingSlashes(url.pathname)}`
}
