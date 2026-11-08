/** Events the hub records; fields are ids, never a body. */
export enum HubLogEvent {
    /** One source of the hub could not be read, so its card shows as unavailable. */
    SourceFailed = "hub.source_failed",
}
