import {
    MANIFEST,
    relayContext,
    type DeviceStream,
    type Frame,
    type ManifestData,
    type RelayContext,
} from "../../world/relay-device-stream.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

/** A task a manifest is requested for. */
const TASK = { input: { taskId: "project-1" } }

/** Requests a manifest as the device and answers the id of the frame the relay pushes for it. */
const pushedFor = async ({ relay }: RelayContext, deviceToken: string): Promise<string> => {
    const answer = await relay().bearing(deviceToken).graphql<ManifestData>(MANIFEST, TASK)
    return `manifest:${answer.data?.relayManifest.manifestId ?? ""}`
}

/** The first frame of the stream with this id. */
const frameOf = (stream: DeviceStream, id: string): Promise<Frame> => stream.frame((frame) => frame.id === id)

/**
 * The realtime delivery of the relay channel with real device sockets (BE-REALTIME-4): a subscriber receives what the committing
 * service publishes on its topic, a push to one learner's device never reaches another learner's, a closed socket releases its
 * subscription, every open connection of a topic gets the one push, and a reconnect resumes after the last frame it took. The hub
 * is the memory hub of the one api replica; a shared hub is refused until it is built, so the cross-replica case is the fan-out
 * of one publisher to several connections.
 */
describe("relay realtime (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const context = relayContext(world, "d3")

    it("realtime/subscriber-receives-push: a manifest the device asked for arrives on its open socket", async () => {
        const device = await context.paired()
        const stream = await context.streamOf(device.deviceToken)
        await stream.frame((frame) => frame.type === "hello")

        const id = await pushedFor(context, device.deviceToken)
        const pushed = await frameOf(stream, id)

        expect(pushed.type).toBe("manifest")
    })

    it("realtime/foreign-topic-is-isolated: a push to one learner's device never reaches another learner's socket", async () => {
        const mine = await context.paired()
        const theirs = await context.paired()
        const mineStream = await context.streamOf(mine.deviceToken)
        const theirsStream = await context.streamOf(theirs.deviceToken)

        const theirId = await pushedFor(context, theirs.deviceToken)
        await frameOf(theirsStream, theirId)
        const myId = await pushedFor(context, mine.deviceToken)
        await frameOf(mineStream, myId)

        expect(mineStream.frames.some((frame) => frame.id === theirId)).toBe(false)
        expect(theirsStream.frames.some((frame) => frame.id === myId)).toBe(false)
    })

    it("realtime/disconnect-releases-subscription: a closed socket goes offline and a reconnect takes the missed frame once", async () => {
        const device = await context.paired()
        const first = await context.streamOf(device.deviceToken)
        const firstId = await pushedFor(context, device.deviceToken)
        await frameOf(first, firstId)
        first.socket.disconnect()
        await context.world.waitUntil(
            "device offline",
            () => context.presenceOf(device.deviceId),
            (row) => row?.online === false,
        )

        const missedId = await pushedFor(context, device.deviceToken)
        const second = await context.streamOf(device.deviceToken, firstId)
        await frameOf(second, missedId)

        expect(first.frames.some((frame) => frame.id === missedId)).toBe(false)
        expect(second.frames.filter((frame) => frame.id === missedId)).toHaveLength(1)
        expect(second.frames.some((frame) => frame.id === firstId)).toBe(false)
    })

    it("realtime/push-crosses-replicas: one publish reaches every open connection of the topic, whichever connection asked for it", async () => {
        const device = await context.paired()
        const one = await context.streamOf(device.deviceToken)
        const other = await context.streamOf(device.deviceToken)

        const id = await pushedFor(context, device.deviceToken)
        const [seenByOne, seenByOther] = await Promise.all([frameOf(one, id), frameOf(other, id)])

        expect(seenByOne.id).toBe(id)
        expect(seenByOther.id).toBe(id)
    })

    it("realtime/resume-after-reconnect: a reconnect with the last frame id takes what it missed and nothing it had", async () => {
        const device = await context.paired()
        const stream = await context.streamOf(device.deviceToken)
        const firstId = await pushedFor(context, device.deviceToken)
        await frameOf(stream, firstId)
        stream.socket.disconnect()
        const missedId = await pushedFor(context, device.deviceToken)

        const resumed = await context.streamOf(device.deviceToken, firstId)
        await frameOf(resumed, missedId)

        expect(resumed.frames.some((frame) => frame.id === firstId)).toBe(false)
    })
})
