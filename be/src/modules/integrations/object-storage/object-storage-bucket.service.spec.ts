import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import type { ObjectStorage } from "@starci/object-storage"
import { LOGGER, type Logger } from "@modules/platform/logging"
import { ObjectStorageError, ObjectStorageErrorCode } from "./errors/object-storage.error"
import { OBJECT_STORAGE_BUCKET } from "./object-storage.decorators"
import { ObjectStorageLogEvent } from "./object-storage.log-events"
import { ObjectStorageBucketService } from "./object-storage-bucket.service"
import { OBJECT_STORAGE } from "@starci/object-storage"

const BUCKET = "app-objects"

const build = async () => {
    const storage = mock<ObjectStorage>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ObjectStorageBucketService,
            { provide: LOGGER, useValue: logger },
            { provide: OBJECT_STORAGE, useValue: storage },
            { provide: OBJECT_STORAGE_BUCKET, useValue: BUCKET },
        ],
    }).compile()
    return { subject: moduleRef.get(ObjectStorageBucketService), storage, logger }
}

describe("ObjectStorageBucketService", () => {
    describe("onModuleInit", () => {
        it("makes sure the app's bucket exists", async () => {
            const { subject, storage, logger } = await build()
            storage.ensureBucket.mockResolvedValue(undefined)

            await subject.onModuleInit()

            expect(storage.ensureBucket).toHaveBeenCalledWith(BUCKET)
            expect(logger.error).not.toHaveBeenCalled()
        })

        it("logs an unreachable store and lets the boot go on", async () => {
            const { subject, storage, logger } = await build()
            const cause = new ObjectStorageError({ code: ObjectStorageErrorCode.Unavailable })
            storage.ensureBucket.mockRejectedValue(cause)

            await expect(subject.onModuleInit()).resolves.toBeUndefined()

            expect(logger.error).toHaveBeenCalledWith(ObjectStorageLogEvent.BucketUnconfirmed, cause, {
                bucket: BUCKET,
            })
        })

        it("stops the boot on any other failure", async () => {
            const { subject, storage, logger } = await build()
            const refused = new Error("bucket name refused")
            storage.ensureBucket.mockRejectedValue(refused)

            await expect(subject.onModuleInit()).rejects.toBe(refused)

            expect(logger.error).not.toHaveBeenCalled()
        })
    })
})
