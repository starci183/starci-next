import { Injectable } from "@nestjs/common"
import type { ProjectHarnessPort } from "./project-harness.port"

@Injectable()
/** The harness port while the harness is not composed: the harness results of a CI run are ignored. */
export class NoHarnessClient implements ProjectHarnessPort {
    /** Records nothing. */
    recordRun(): Promise<void> {
        return Promise.resolve()
    }
}
