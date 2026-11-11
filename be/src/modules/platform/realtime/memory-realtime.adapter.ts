import { Injectable } from "@nestjs/common"
import {
    REPLAY_FRAMES_MAX,
    type RealtimeFrame,
    type RealtimeHub,
    type RealtimeTopic,
    type SubscribeOptions,
} from "./realtime.contracts"

/** One live subscription: the frames waiting to be taken and the taker waiting for the next one. */
interface Listener {
    readonly queue: Array<RealtimeFrame>
    wake: (() => void) | undefined
    isClosed: boolean
}

/** The frames a topic retains and the subscriptions listening to it. */
interface TopicState {
    readonly retained: Array<RealtimeFrame>
    readonly listeners: Set<Listener>
}

/** A frame of a topic is of the topic's frame type: only its own publishers, typed by the same topic, push to it. */
const isFrameOf = <Frame extends RealtimeFrame>(frame: RealtimeFrame | undefined): frame is Frame => frame !== undefined

@Injectable()
/**
 * The in-process hub of one replica (BE-REALTIME-7): a bounded replay of the last frames per topic and live fan-out to the
 * subscriptions of this process. A subscription with `after` gets the retained frames after that id first (all of them when
 * the id is no longer retained), then the live ones.
 */
export class MemoryRealtimeHub implements RealtimeHub {
    private readonly topics = new Map<string, TopicState>()

    /** Retains the frame and hands it to every open subscription of the topic. */
    publish<Frame extends RealtimeFrame>(topic: RealtimeTopic<Frame>, frame: Frame): Promise<void> {
        const state = this.stateOf(topic.name)
        state.retained.push(frame)
        if (state.retained.length > REPLAY_FRAMES_MAX) state.retained.shift()
        state.listeners.forEach((listener) => {
            listener.queue.push(frame)
            listener.wake?.()
        })
        return Promise.resolve()
    }

    /** The retained frames after `after`, then the live frames, until the iterator is returned. */
    subscribe<Frame extends RealtimeFrame>(
        topic: RealtimeTopic<Frame>,
        options?: SubscribeOptions,
    ): AsyncIterable<Frame> {
        const state = this.stateOf(topic.name)
        const after = options?.after
        const at =
            after === undefined ? state.retained.length : state.retained.findIndex((frame) => frame.id === after) + 1
        const listener: Listener = { queue: state.retained.slice(at), wake: undefined, isClosed: false }
        state.listeners.add(listener)
        const close = (): void => {
            listener.isClosed = true
            state.listeners.delete(listener)
            listener.wake?.()
        }
        const next = (): Promise<IteratorResult<Frame>> => {
            const frame = listener.queue.shift()
            if (isFrameOf<Frame>(frame)) return Promise.resolve({ done: false, value: frame })
            if (listener.isClosed) return Promise.resolve({ done: true, value: undefined })
            return new Promise<void>((resolve) => {
                listener.wake = resolve
            }).then(() => {
                listener.wake = undefined
                return listener.isClosed ? { done: true, value: undefined } : next()
            })
        }
        return {
            [Symbol.asyncIterator]: () => ({
                next,
                return: () => {
                    close()
                    return Promise.resolve({ done: true, value: undefined })
                },
            }),
        }
    }

    /** How many subscriptions are open on a topic; the realtime specs prove a disconnect releases its subscription. */
    listenerCount(topicName: string): number {
        return this.topics.get(topicName)?.listeners.size ?? 0
    }

    /** The state of a topic, created on first use. */
    private stateOf(name: string): TopicState {
        const known = this.topics.get(name)
        if (known !== undefined) return known
        const created: TopicState = { retained: [], listeners: new Set() }
        this.topics.set(name, created)
        return created
    }
}
