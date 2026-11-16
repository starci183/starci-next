import type { Type } from "@nestjs/common"
import type { ProgressHarnessPort } from "./progress-harness.port"

/** Options of the progress capability. */
export interface ProgressOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** The harness read the progress shows; absent, the sample read of the harness contract. */
    readonly harness?: Type<ProgressHarnessPort>
}
