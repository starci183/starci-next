import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { MigrationRunnerService } from "@modules/platform/database"
import { SeedDoorService } from "@modules/integrations/seed"
import { DataDatabaseCli } from "./database.cli"

const build = async () => {
    const door = mock<SeedDoorService>()
    const migrations = mock<MigrationRunnerService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            DataDatabaseCli,
            { provide: SeedDoorService, useValue: door },
            { provide: MigrationRunnerService, useValue: migrations },
        ],
    }).compile()
    return { command: moduleRef.get(DataDatabaseCli), door, migrations }
}

describe("DataDatabaseCli", () => {
    afterEach(() => {
        process.exitCode = undefined
    })

    it("serves the verb it was given over stdin and stdout, once, and takes the protocol exit code", async () => {
        const { command, door, migrations } = await build()
        door.serve.mockResolvedValue(2)

        await command.run(["import", '{"dryRun":true,"mode":"merge"}'])

        expect(door.serve).toHaveBeenCalledWith(
            ["import", '{"dryRun":true,"mode":"merge"}'],
            process.stdin,
            process.stdout,
        )
        expect(migrations.run).toHaveBeenCalledTimes(1)
        expect(door.serve).toHaveBeenCalledTimes(1)
        expect(process.exitCode).toBe(2)
    })
})
