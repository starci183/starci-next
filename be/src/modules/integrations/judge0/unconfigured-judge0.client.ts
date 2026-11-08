import { Injectable } from "@nestjs/common"
import { Judge0Error, Judge0ErrorCode } from "./errors/judge0.error"
import type { Judge0CaseResult } from "./judge0.contracts"
import type { Judge0Gateway } from "./judge0.port"

@Injectable()
/** The judge of an instance that declared no Judge0 endpoint: it runs nothing and says so with a stable code. */
export class UnconfiguredJudge0Client implements Judge0Gateway {
    /** Always refuses with JUDGE0_NOT_CONFIGURED. */
    run(): Promise<ReadonlyArray<Judge0CaseResult>> {
        return Promise.reject(new Judge0Error({ code: Judge0ErrorCode.NotConfigured }))
    }
}
