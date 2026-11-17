import { Injectable, type OnModuleInit } from "@nestjs/common"
import type { ObjectStorage } from "@starci/object-storage"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ObjectStorageErrorCode } from "./errors/object-storage.error"
import { InjectObjectStorage, InjectObjectStorageBucket } from "./object-storage.decorators"
import { ObjectStorageLogEvent } from "./object-storage.log-events"

const isUnavailable = (cause: unknown): boolean =>
    typeof cause === "object" && cause !== null && "code" in cause && cause.code === ObjectStorageErrorCode.Unavailable

@Injectable()
/** Makes sure the app's bucket exists when a fresh store starts empty; an unreachable store is logged, never a reason to stop the boot. */
export class ObjectStorageBucketService implements OnModuleInit {
    constructor(
        @InjectLogger() private readonly logger: Logger,
        @InjectObjectStorage() private readonly storage: ObjectStorage,
        @InjectObjectStorageBucket() private readonly bucket: string,
    ) {}

    /** Creates the bucket when the store lacks it; any failure other than an unreachable store (a bucket name the store refuses) stops the boot. */
    async onModuleInit(): Promise<void> {
        try {
            await this.storage.ensureBucket(this.bucket)
        } catch (cause) {
            if (!isUnavailable(cause)) throw cause
            this.logger.error(ObjectStorageLogEvent.BucketUnconfirmed, cause, { bucket: this.bucket })
        }
    }
}
