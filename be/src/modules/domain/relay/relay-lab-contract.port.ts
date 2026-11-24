import { Injectable } from "@nestjs/common"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { RelayLabContract, RelayLabCut, RelayLabFile, RelayLabHiddenFile } from "./relay-lab.contracts"

/**
 * Token of the port that answers the lab contract of a lesson. The course capability provides it from a global module and exports it;
 * the relay asks for it as an optional dependency and falls back to `RelayLabContractUnconfiguredAdapter`, so the app boots without it.
 */
export const RELAY_LAB_CONTRACT: unique symbol = Symbol("domain.relay.lab-contract")

/** What the relay asks the course capability about a lab: its contract, the files of its two cuts, its hidden grading files and ids. */
export interface RelayLabContractPort {
    /** The lab contract of a lesson of a course, or null when the lesson has no lab (or the course does not exist). */
    contractOf(courseId: string, lessonId: string): Promise<RelayLabContract | null>
    /**
     * The files of one cut of the lab, paths relative to the cut: `bugs` is the lesson branch (`bugs/source/` of the seed standard,
     * what the learner gets), `solution` is the solution (`source/`) and `framework:nestjs` is the NestJS version
     * (`framework/nestjs/`); both open after a passing submission. Never a hidden file. Empty when the lab has no such cut.
     */
    labFilesOf(courseId: string, lessonId: string, cut: RelayLabCut): Promise<ReadonlyArray<RelayLabFile>>
    /**
     * The hidden grading files of the lesson's lab: each `path` is already under the contract's `grading.into` and each `sha256` is
     * that of its text. Empty when it has none. Never read for the web.
     */
    hiddenOf(courseId: string, lessonId: string): Promise<ReadonlyArray<RelayLabHiddenFile>>
    /** The ids of the hidden tests the grading files hold; a grade result must name each exactly once. Empty when it has none. */
    hiddenTestIdsOf(courseId: string, lessonId: string): Promise<ReadonlyArray<string>>
}

/** Injects the lab contract port. Parameter type: RelayLabContractPort. */
export const InjectRelayLabContract = (): TypedParameterDecorator<RelayLabContractPort> =>
    injector<RelayLabContractPort>(RELAY_LAB_CONTRACT)

@Injectable()
/** The default lab contract port: no course capability is bound, so no lesson has a lab and the app still boots. */
export class RelayLabContractUnconfiguredAdapter implements RelayLabContractPort {
    /** Answers that no lesson has a lab. */
    contractOf(): Promise<RelayLabContract | null> {
        return Promise.resolve(null)
    }

    /** Answers that no lab has files. */
    labFilesOf(): Promise<ReadonlyArray<RelayLabFile>> {
        return Promise.resolve([])
    }

    /** Answers that no lab has hidden files. */
    hiddenOf(): Promise<ReadonlyArray<RelayLabHiddenFile>> {
        return Promise.resolve([])
    }

    /** Answers that no lab has hidden tests. */
    hiddenTestIdsOf(): Promise<ReadonlyArray<string>> {
        return Promise.resolve([])
    }
}
