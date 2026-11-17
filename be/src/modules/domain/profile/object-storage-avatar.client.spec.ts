import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { OBJECT_STORAGE, OBJECT_STORAGE_BUCKET, type ObjectStorage } from "@modules/integrations/object-storage"
import { ObjectStorageAvatarClient } from "./object-storage-avatar.client"

const BUCKET = "starci-next"
const KEY = "avatars/20000000-0000-4000-8000-000000000004/00000000-0000-4000-8000-000000000001.png"

const build = async () => {
    const storage = mock<ObjectStorage>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ObjectStorageAvatarClient,
            { provide: OBJECT_STORAGE, useValue: storage },
            { provide: OBJECT_STORAGE_BUCKET, useValue: BUCKET },
        ],
    }).compile()
    return { client: moduleRef.get(ObjectStorageAvatarClient), storage }
}

describe("ObjectStorageAvatarClient", () => {
    it("signs an upload in the app bucket that fixes the type and the size", async () => {
        const { client, storage } = await build()
        storage.presignPut.mockResolvedValue({
            method: "PUT",
            url: "https://store/put",
            headers: { "Content-Type": "image/png" },
            expiresIn: 300,
            expiresAt: "2026-11-17T03:05:00.000Z",
        })

        const signed = await client.presignUpload(KEY, { contentType: "image/png", contentLength: 100, expiresIn: 300 })

        expect(storage.presignPut).toHaveBeenCalledWith(BUCKET, KEY, {
            contentType: "image/png",
            contentLength: 100,
            expiresIn: 300,
        })
        expect(signed).toEqual({
            url: "https://store/put",
            headers: { "Content-Type": "image/png" },
            expiresAt: "2026-11-17T03:05:00.000Z",
        })
    })

    it("answers the signed read address, and the size and type the store recorded", async () => {
        const { client, storage } = await build()
        storage.presignGet.mockResolvedValue({
            method: "GET",
            url: "https://store/get",
            headers: {},
            expiresIn: 300,
            expiresAt: "x",
        })
        storage.head.mockResolvedValueOnce({ size: 100, contentType: "image/png", lastModified: null, etag: null })
        storage.head.mockResolvedValueOnce(null)

        await expect(client.presignRead(KEY)).resolves.toBe("https://store/get")
        await expect(client.head(KEY)).resolves.toEqual({ size: 100, contentType: "image/png" })
        await expect(client.head(KEY)).resolves.toBeNull()
    })

    it("deletes the key in the app bucket", async () => {
        const { client, storage } = await build()
        storage.remove.mockResolvedValue(undefined)

        await client.remove(KEY)

        expect(storage.remove).toHaveBeenCalledWith(BUCKET, KEY)
    })
})
