/** A typed topic: a name the owning domain contract builds, carrying the frame type its subscribers receive. */
export interface RealtimeTopic<Frame extends RealtimeFrame> {
    /** The topic name, scoped by its builder to the principal it belongs to. */
    readonly name: string
    /** Type-only marker of the frame type; never read at run time. */
    readonly frame?: Frame
}

/** Every frame carries an id unique within its topic, so a reconnect resumes after the last one it took. */
export interface RealtimeFrame {
    /** The frame id, unique within its topic. */
    readonly id: string
}

/** How a subscription starts: after the frame id the client last took, or at the live end when none is given. */
export interface SubscribeOptions {
    /** The id of the last frame the client took; the hub replays what it retains after it. */
    readonly after?: string | undefined
}

/** The pub/sub port realtime doors read and committing services publish to. */
export interface RealtimeHub {
    /** Publishes one frame to a topic and settles once the hub accepted it. */
    publish<Frame extends RealtimeFrame>(topic: RealtimeTopic<Frame>, frame: Frame): Promise<void>
    /** The frames of a topic: the retained ones after `after`, then the live ones, until the iterator is returned. */
    subscribe<Frame extends RealtimeFrame>(
        topic: RealtimeTopic<Frame>,
        options?: SubscribeOptions,
    ): AsyncIterable<Frame>
}

/** The most frames a topic retains for replay. */
export const REPLAY_FRAMES_MAX = 64
