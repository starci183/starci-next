import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ContentSyncService } from "@modules/domain/content"
import { SyncContentCli } from "./sync.cli"

describe("SyncContentCli", () => {
    it("delegates the two local directories and the kind list to the sync once, and takes the flags as given", async () => {
        const content = mock<ContentSyncService>()
        const moduleRef = await Test.createTestingModule({
            providers: [SyncContentCli, { provide: ContentSyncService, useValue: content }],
        }).compile()
        const command = moduleRef.get(SyncContentCli)

        await command.run([], { dir: "content", dataDir: "data", only: "lessons,catalogs" })

        expect(content.sync).toHaveBeenCalledTimes(1)
        expect(content.sync).toHaveBeenCalledWith({ contentDir: "content", dataDir: "data", only: "lessons,catalogs" })
        expect([command.parseDir("c"), command.parseDataDir("d"), command.parseOnly("a,b")]).toEqual(["c", "d", "a,b"])
    })

    it("asks for the git mount when no directory is given", async () => {
        const content = mock<ContentSyncService>()
        const moduleRef = await Test.createTestingModule({
            providers: [SyncContentCli, { provide: ContentSyncService, useValue: content }],
        }).compile()

        await moduleRef.get(SyncContentCli).run([], { only: "" })

        expect(content.sync).toHaveBeenCalledWith({ contentDir: undefined, dataDir: undefined, only: "" })
    })
})
