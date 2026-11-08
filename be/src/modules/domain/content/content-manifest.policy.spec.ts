import { Test } from "@nestjs/testing"
import { ContentErrorCode } from "./errors/content.error"
import { catalogFilesOf, catalogKindsOf, manifestOf } from "./content-manifest.policy"

const TEXT = `
schema: starci-next-data/manifest@1
name: starci-next-data
contentVersion: 1
kinds:
  - {id: concepts, folder: concepts, format: concept-v2, source: starci-lab/data}
  - {id: paths, folder: paths, format: yaml, schema: outcome-path, source: this-repo, files: '^paths/[a-z-]+\.yaml$'}
`

const MANIFEST_POLICY: unique symbol = Symbol("content.manifest-policy")

const policy = { manifestOf, catalogKindsOf, catalogFilesOf }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: MANIFEST_POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get<typeof policy>(MANIFEST_POLICY)
}

describe("manifestOf", () => {
    it("reads the kinds of a valid manifest", async () => {
        const subject = await build()

        const manifest = subject.manifestOf(TEXT)

        expect(manifest.kinds.map((kind) => kind.id)).toEqual(["concepts", "paths"])
    })

    it("refuses a document that is not a manifest, naming the fields and no value", async () => {
        const subject = await build()

        expect(() => subject.manifestOf("schema: wrong\nname: x\n")).toThrow(ContentErrorCode.ManifestInvalid)
    })

    it("refuses text that is not YAML", async () => {
        const subject = await build()

        expect(() => subject.manifestOf("a: [1, 2")).toThrow(ContentErrorCode.ManifestInvalid)
    })
})

describe("catalog helpers", () => {
    it("keeps only the YAML kinds this repository owns and counts the files each matches", async () => {
        const subject = await build()
        const manifest = subject.manifestOf(TEXT)

        const kinds = subject.catalogKindsOf(manifest)

        expect(kinds.map((kind) => kind.id)).toEqual(["paths"])
        expect(
            kinds.flatMap((kind) =>
                subject.catalogFilesOf(kind, ["paths/founder.yaml", "paths/x/y.yaml", "README.md"]),
            ),
        ).toEqual(["paths/founder.yaml"])
    })
})
