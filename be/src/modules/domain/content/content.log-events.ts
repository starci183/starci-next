/** Events the content capability records; fields are kinds, versions, shas and counts, never content or a token. */
export enum ContentLogEvent {
    /** One repository was materialised as a snapshot, or found already stored. */
    Pulled = "content.pulled",
    /** One kind of content was imported, skipped or failed during a sync. */
    Synced = "content.synced",
}
