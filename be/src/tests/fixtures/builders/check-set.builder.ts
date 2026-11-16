import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { mock } from "@starci/jest-preset"
import type { ProjectKind } from "@modules/domain/project/project.contracts"
import { checkSetOf } from "@modules/domain/project/project-check-set.policy"
import type { CheckSet, CheckSetFiles } from "@modules/domain/project/project-check-set.contracts"
import { ProjectCheckSetService } from "@modules/domain/project/project-check-set.service"

const CHECKS = join(__dirname, "..", "project-checks")

/** The raw files of the check set the tests carry: the same content copy the server reads, probes included. */
export const FIXTURE_CHECK_FILES: CheckSetFiles = {
    version: "fixture",
    catalog: readFileSync(join(CHECKS, "catalog.yaml"), "utf8"),
    probes: Object.fromEntries(
        readdirSync(join(CHECKS, "probes")).map((name) => [name, readFileSync(join(CHECKS, "probes", name), "utf8")]),
    ),
}

/** The check set of the fixture content, parsed as the server parses it. */
export const fixtureCheckSet = (): CheckSet => checkSetOf(FIXTURE_CHECK_FILES)

/** A check set service that answers the fixture check set (or the one given), for a spec that is not about reading it. */
export const checkSetServiceOf = (set: CheckSet = fixtureCheckSet()): ProjectCheckSetService => {
    const service = mock<ProjectCheckSetService>()
    service.current.mockResolvedValue(set)
    service.milestonesOfKind.mockImplementation((kind: ProjectKind) =>
        Promise.resolve(set.milestones.filter((milestone) => set.kinds[kind].includes(milestone.id))),
    )
    service.conceptOf.mockImplementation((id: string) =>
        Promise.resolve(set.concepts.find((concept) => concept.id === id) ?? null),
    )
    return service
}
