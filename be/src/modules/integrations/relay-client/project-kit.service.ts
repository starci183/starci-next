import { Injectable } from "@nestjs/common"
import type { CliIo } from "./relay-client.contracts"
import type { InitOptions } from "./relay-client.port"
import { initProject } from "./project-init.cli"
import { readProjectFile } from "./project-kit.adapter"
import { runProject } from "./project-run.cli"

@Injectable()
/** The learner's own project folder: the kit `init` copies into it, and the milestone `run` checks there. */
export class ProjectKitService {
    /** True when the folder is a StarCi project (it holds `starci/project.yaml`). */
    isProject(cwd: string): boolean {
        return readProjectFile(cwd, "starci/project.yaml") !== null
    }

    /** Copies the kit into the folder; answers the exit code. */
    init(io: CliIo, options: InitOptions, cwd: string): number {
        return initProject(io, options, cwd)
    }

    /** Runs a milestone's signed check in the folder and uploads the results; answers the exit code. */
    run(io: CliIo, milestone: string, isConfirmed: boolean, cwd: string): Promise<number> {
        return runProject(io, milestone, isConfirmed, cwd)
    }
}
