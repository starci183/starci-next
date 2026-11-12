import { PROBE_ERROR_KINDS, ProbeErrorCode } from "@modules/integrations/probe"
import { ProbeTransportHolder, probeModules } from "../../world/probe-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** One probe request of the spec: a plain GET with small caps. */
const getOf = (url: string) => ({
    method: "GET",
    url,
    headers: {},
    body: null,
    timeoutMs: 2000,
    maxBytes: 1024,
})

/**
 * probe (integration): the guarded transport over the real HTTP wire. Probes reach public addresses only, so a loopback peer of the
 * world (the core app) is refused as PROBE_TARGET_REFUSED, and the
 * transport answers the reason instead of throwing, also while the peer is down.
 */
describe("probe (integration)", () => {
    const world = useTestWorld({ modules: probeModules, apps: ["core"] })
    /** The core app of the world by the name `localhost`: a name that resolves to loopback, so the guard sees it at lookup. */
    const peerUrl = (): string => `http://localhost:${new URL(world.apps.core?.url ?? "http://localhost:1").port}`
    const transport = () => world.resolve(ProbeTransportHolder).transport

    it("refuses a loopback target: the refusal is the one the code maps as invalid", async () => {
        const reply = await transport().send(getOf(peerUrl()))

        expect(reply).toEqual({ ok: false, error: "target-refused" })
        expect(PROBE_ERROR_KINDS[ProbeErrorCode.TargetRefused]).toBe("invalid")
    })

    it("answers a reason, never throws, while the peer is down", async () => {
        const reply = await world.apps.core?.during(() => transport().send(getOf(peerUrl())))

        expect(reply?.ok).toBe(false)
    })

    it("does not count a loopback name as a public host", async () => {
        expect(await transport().isPublicHost("localhost")).toBe(false)
    })
})
