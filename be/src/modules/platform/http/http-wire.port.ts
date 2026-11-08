import type { LookupFunction } from "node:net"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/** One address a name resolves to. */
export interface WireAddress {
    /** The IP address as text. */
    readonly address: string
    /** 4 or 6. */
    readonly family: number
}

/** The name resolution of a socket, which is where an address guard sits. */
export interface WireLookup {
    (...args: Parameters<LookupFunction>): void
}

/** Receives each chunk of a response body. */
export interface WireChunkListener {
    (chunk: Buffer): void
}

/** Receives a signal with no value (the end or the break of a body). */
export interface WireSignalListener {
    (): void
}

/** The body of a request, or null for a request without one. */
export type WireBody = string | null

/** What the wire sends with a request besides the body. */
export interface WireOptions {
    /** The HTTP method. */
    readonly method: string
    /** The headers to send. */
    readonly headers: Readonly<Record<string, string>>
    /** The function the socket resolves the name with, which is where the address guard sits. */
    readonly lookup: WireLookup
}

/** A response whose head arrived, to be read piece by piece. */
export interface WireResponse {
    /** The status code. */
    readonly status: number
    /** The headers as the wire received them. */
    readonly headers: Readonly<Record<string, string | ReadonlyArray<string> | undefined>>
    /** Calls back with each chunk of the body. */
    onData(callback: WireChunkListener): void
    /** Calls back when the body ended. */
    onEnd(callback: WireSignalListener): void
    /** Calls back when the body broke. */
    onError(callback: WireSignalListener): void
    /** Drops the rest of the body. */
    destroy(): void
}

/** What a request in flight reports. */
export interface WireCall {
    /** The response head arrived. */
    readonly onResponse: (response: WireResponse) => void
    /** The connection failed before a response. */
    readonly onError: (failure: Error) => void
}

/** A request in flight. */
export interface WireRequest {
    /** Stops the request. */
    abort(): void
}

/** The raw network of the platform: a request over http or https, and the resolution of a name. */
export interface HttpWire {
    /** Sends the request to the address (http or https by its protocol) with the body and reports to the call. */
    open(url: URL, options: WireOptions, body: WireBody, call: WireCall): WireRequest
    /** Resolves a name to all its addresses. */
    resolve(hostname: string): Promise<ReadonlyArray<WireAddress>>
}

/** Token of the http wire. */
export const HTTP_WIRE: unique symbol = Symbol("platform.http.wire")

/** Injects the http wire. Parameter type: HttpWire. */
export const InjectHttpWire = (): TypedParameterDecorator<HttpWire> => injector<HttpWire>(HTTP_WIRE)
