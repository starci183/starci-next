import { CommandRunner, SubCommand } from "nest-commander"
import { SeedDoorService } from "@modules/integrations/seed"

@SubCommand({
    name: "database",
    description:
        "Serve the database store over the line protocol starci/data-entries@1 (describe, export, import, identity)",
    arguments: "<verb> [argument...]",
})
/**
 * `cli data database <verb> [argument...]`: the seed door of the `database` store, the `adapter.command` of
 * `.starcistacks/application-stacks.yaml`. The bring-up loader runs it to write a pinned seed standard into the app by natural key;
 * `import` reads the entry lines on stdin and answers its report on the last line of stdout.
 */
export class DataDatabaseCli extends CommandRunner {
    constructor(private readonly door: SeedDoorService) {
        super()
    }

    /**
     * Serves the verb over stdin and stdout and sets the exit code the protocol answers. The tables the sets write exist already: the
     * stack's `migrate-typeorm` seed step (`mode: always`) runs before the loader.
     */
    async run(passed: Array<string>): Promise<void> {
        process.exitCode = await this.door.serve(passed, process.stdin, process.stdout)
    }
}
