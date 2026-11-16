/** Events the object storage integration records; fields are bucket names, never a key or a credential. */
export enum ObjectStorageLogEvent {
    /** The store did not answer when the app's bucket was checked at boot. */
    BucketUnconfirmed = "object_storage.bucket_unconfirmed",
}
