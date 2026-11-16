import { OBJECT_STORAGE, OBJECT_STORAGE_BUCKET, ObjectStorageErrorCode } from "@modules/integrations/object-storage"
import type { ObjectStorage } from "@starci/object-storage"
import { objectStorageModules } from "../../world/object-storage-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * object storage (integration): the integration registered against the world's real MinIO. It proves the app's bucket is made on demand, an
 * object written is read back, a missing one is the coded not-found, and a store that is cut off surfaces as the coded unavailable error
 * (ObjectStorageErrorCode).
 */
describe("object storage (integration)", () => {
    const world = useTestWorld({ modules: objectStorageModules })
    const storage = (): ObjectStorage => world.resolve<ObjectStorage>(OBJECT_STORAGE)
    const bucket = (): string => world.resolve<string>(OBJECT_STORAGE_BUCKET)

    it("stores an object in the app's bucket and reads it back", async () => {
        await storage().ensureBucket(bucket())
        await storage().put(bucket(), "avatars/ada.txt", new TextEncoder().encode("hello"), "text/plain")

        const stored = await storage().get(bucket(), "avatars/ada.txt")

        expect(stored).not.toBeNull()
        expect(new TextDecoder().decode(stored?.body)).toBe("hello")
    })

    it("answers null for an object that was never written", async () => {
        await storage().ensureBucket(bucket())

        expect(await storage().get(bucket(), "avatars/ghost.txt")).toBeNull()
    })

    it("refuses an object key the store does not accept with OBJECT_STORAGE_KEY_INVALID", async () => {
        await expect(storage().head(bucket(), "")).rejects.toMatchObject({ code: ObjectStorageErrorCode.KeyInvalid })
    })

    it("reports a store that is cut off as unavailable with OBJECT_STORAGE_UNAVAILABLE", async () => {
        await world.infra.minio.cut()

        try {
            await expect(storage().head(bucket(), "avatars/ada.txt")).rejects.toMatchObject({
                code: ObjectStorageErrorCode.Unavailable,
            })
        } finally {
            await world.infra.minio.restore()
        }
    })
})
