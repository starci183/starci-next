/** Events the relay records; fields are device ids and codes, never a token, a manifest payload or a log text. */
export enum RelayLogEvent {
    /** A device socket was refused at the handshake (no token, an unknown or a revoked one, or the store failed). */
    SocketRefused = "relay.socket_refused",
    /** A device stream ended on a failure (presence or the hub); the socket was closed and the device reconnects. */
    StreamFailed = "relay.stream_failed",
}
