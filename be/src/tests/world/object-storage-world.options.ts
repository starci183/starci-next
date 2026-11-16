import type { ModuleFactory } from "@starci/test-world"
import { ObjectStorageModule } from "@modules/integrations/object-storage"

/** The logical bucket of the app's objects (declared in `stacks.minio.buckets`; a run stores it under its own prefix). */
export const WORLD_BUCKET = "starci-next"

/** The modules of the object storage world: the integration pointed at the real MinIO of the run, with the run's own bucket. */
export const objectStorageModules: ReadonlyArray<ModuleFactory> = [
    (w) =>
        ObjectStorageModule.register({
            isGlobal: true,
            endpoint: w.minio.endpoint,
            region: "us-east-1",
            bucket: w.minio.bucket(WORLD_BUCKET),
            accessKeyId: w.minio.accessKey,
            secretAccessKey: w.minio.secretKey,
        }),
]
