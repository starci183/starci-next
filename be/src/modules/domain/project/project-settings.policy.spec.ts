import { Test } from "@nestjs/testing"

import { projectSettingsOf } from "./project-settings.policy"

const POLICY: unique symbol = Symbol("project.project-settings-policy")
const policies = { projectSettingsOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("projectSettingsOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("falls back to the proposed defaults", () => {
        expect(subject.projectSettingsOf({})).toEqual({
            freeProjects: 1,
            freeMilestones: ["bf-http-foundation"],
            probeRunsPerHour: 6,
            codeReadsPerDay: 20,
            probeTimeoutMs: 6000,
            probeMaxBytes: 65_536,
            probeParallel: 10,
            ciToleranceMs: 600_000,
            codeReadTimeoutMs: 60_000,
        })
    })

    it("takes every value the app names", () => {
        expect(
            subject.projectSettingsOf({
                freeProjects: 3,
                freeMilestones: ["a", "b"],
                probeRunsPerHour: 2,
                codeReadsPerDay: 5,
                probeTimeoutMs: 1000,
                probeMaxBytes: 10,
                probeParallel: 4,
                ciToleranceMs: 5000,
                codeReadTimeoutMs: 9000,
            }),
        ).toEqual({
            freeProjects: 3,
            freeMilestones: ["a", "b"],
            probeRunsPerHour: 2,
            codeReadsPerDay: 5,
            probeTimeoutMs: 1000,
            probeMaxBytes: 10,
            probeParallel: 4,
            ciToleranceMs: 5000,
            codeReadTimeoutMs: 9000,
        })
    })
})
