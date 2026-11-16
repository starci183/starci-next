import { Injectable, type OnModuleInit } from "@nestjs/common"
import type { ObjectStorage } from "@starci/object-storage"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ObjectStorageLogEvent } from "./object-storage.log-events"
import { InjectObjectStorage, InjectObjectStorageBucket } from "./object-storage.decorators"

@Injectable()
/** Makes sure the app's bucket exists when a fresh store starts empty; an unreachable store is logged, never a reason to stop the boot. */
export class ObjectStorageBucketService implements OnModuleInit {
    constructor(
        @InjectLogger() private readonly logger: Logger,
        @InjectObjectStorage() private readonly storage: ObjectStorage,
        @InjectObjectStorageBucket() private readonly bucket: string,
    ) {}

    /** Creates the bucket when the store lacks it. */
    async onModuleInit(): Promise<void> {
        try {
            await this.storage.ensureBucket(this.bucket)
        } catch (cause) {
            this.logger.error(ObjectStorageLogEvent.BucketUnconfirmed, cause, { bucket: this.bucket })
        }
    }
}
