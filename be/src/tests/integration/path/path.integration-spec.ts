import { learnersOf } from "../../fixtures/builders/identity.builder"
import { PATH_TITLES_VI } from "../../fixtures/builders/path.builder"
import { attemptDoors, type GraphqlBody } from "../../world/attempt-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface PathCheck {
    readonly text: string
    readonly selfReported: boolean
}

interface PathPart {
    readonly part: string
    readonly label: string
}

interface PathStep {
    readonly stepId: string
    readonly link: string
}

interface PathStage {
    readonly stageId: string
    readonly steps: ReadonlyArray<PathStep>
}

interface PathBody {
    readonly pathId: string
    readonly kind: string
    readonly title: string
    readonly done: string
    readonly checks: ReadonlyArray<PathCheck>
    readonly stepCount: number
    readonly parts: ReadonlyArray<PathPart>
    readonly stages: ReadonlyArray<PathStage>
}

interface PathList {
    readonly activePathId: string | null
    readonly paths: ReadonlyArray<PathBody>
}

interface PathsBody {
    readonly outcomePaths: PathList
}

interface ChosenPath {
    readonly activePathId: string
    readonly chosenAt: string
}

interface ChooseBody {
    readonly chooseOutcomePath: ChosenPath
}

interface ActivePathCard {
    readonly pathId: string
    readonly title: string
    readonly next: ReadonlyArray<string>
}

interface LearnerHub {
    readonly activePath: ActivePathCard | null
}

interface HubBody {
    readonly learnerHub: LearnerHub
}

const PATHS = `query Paths($input: OutcomePathsInput!) {
  outcomePaths(input: $input) {
    activePathId
    paths {
      pathId kind title done stepCount
      checks { text selfReported }
      parts { part label }
      stages { stageId steps { stepId link } }
    }
  }
}`

const CHOOSE = `mutation Choose($input: ChooseOutcomePathInput!) {
  chooseOutcomePath(input: $input) { activePathId chosenAt }
}`

const HUB = `query Hub($input: LearnerHubInput!) { learnerHub(input: $input) { activePath { pathId title next } } }`

const PATH_IDS: ReadonlyArray<string> = [
    "founder",
    "ai-engineer",
    "backend-fullstack",
    "devops-sre",
    "system-design-senior",
]

/** The five paths in the stable order, with their Vietnamese titles, the English title of the first and a well-formed outcome each. */
const expectCatalogOf = (paths: ReadonlyArray<PathBody>, englishFirstTitle: string | undefined): void => {
    expect(paths.map((path) => path.pathId)).toEqual(PATH_IDS)
    expect(paths.map((path) => path.title)).toEqual(PATH_TITLES_VI)
    expect(englishFirstTitle).toBe("Founder")
    for (const path of paths) {
        expect(path.done.length).toBeGreaterThan(0)
        expect(path.checks.at(-1)?.selfReported).toBe(true)
        expect(path.stages.flatMap((stage) => stage.steps)).toHaveLength(path.stepCount)
        expect(path.parts.length).toBeGreaterThan(1)
    }
}

/**
 * The outcome path doors (integration): `outcomePaths` and `chooseOutcomePath` of the real core app behind the real session guard. It
 * proves the session gate, the five paths in both locales, choosing and switching a path, PATH_NOT_FOUND, and that the hub card
 * shows the path the learner follows.
 */
describe("outcome path doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = attemptDoors(world)
    const nextLearner = learnersOf("f1")

    beforeEach(async () => {
        await doors.reset()
    })

    it.each([
        [PATHS, { input: { locale: "vi" } }],
        [CHOOSE, { input: { pathId: "founder" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await doors.ask(query, variables)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists the five paths in the stable order with a done outcome and no active path for a new learner", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const vi: GraphqlBody<PathsBody> = await doors.ask<PathsBody>(PATHS, { input: { locale: "vi" } }, cookie)
        const en = await doors.ask<PathsBody>(PATHS, { input: { locale: "en" } }, cookie)
        const paths = vi.data?.outcomePaths.paths ?? []

        expect(vi.errors).toBeUndefined()
        expect(vi.data?.outcomePaths.activePathId).toBeNull()
        expectCatalogOf(paths, en.data?.outcomePaths.paths[0]?.title)
        expect(paths[0]?.stages[0]?.steps[0]?.link).toBe("/essentials")
    })

    it("follows a path, shows it as active, keeps the first time when chosen again and lets the learner switch", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const first = await doors.ask<ChooseBody>(CHOOSE, { input: { pathId: "ai-engineer" } }, cookie)
        const again = await doors.ask<ChooseBody>(CHOOSE, { input: { pathId: "ai-engineer" } }, cookie)
        const listed = await doors.ask<PathsBody>(PATHS, { input: { locale: "en" } }, cookie)
        const hub = await doors.ask<HubBody>(HUB, { input: { locale: "en" } }, cookie)
        const switched = await doors.ask<ChooseBody>(CHOOSE, { input: { pathId: "devops-sre" } }, cookie)
        const hubAfter = await doors.ask<HubBody>(HUB, { input: { locale: "vi" } }, cookie)

        expect(first.errors).toBeUndefined()
        expect(first.data?.chooseOutcomePath.activePathId).toBe("ai-engineer")
        expect(again.data?.chooseOutcomePath.chosenAt).toBe(first.data?.chooseOutcomePath.chosenAt)
        expect(listed.data?.outcomePaths.activePathId).toBe("ai-engineer")
        expect(hub.data?.learnerHub.activePath).toMatchObject({ pathId: "ai-engineer", title: "AI Engineer" })
        expect(hub.data?.learnerHub.activePath?.next).toHaveLength(3)
        expect(switched.data?.chooseOutcomePath.activePathId).toBe("devops-sre")
        expect(hubAfter.data?.learnerHub.activePath).toMatchObject({ pathId: "devops-sre", title: "DevOps / SRE" })
    })

    it("keeps each learner's path to themselves", async () => {
        const first = await doors.signIn(nextLearner(), false)
        const second = await doors.signIn(nextLearner(), false)

        await doors.ask<ChooseBody>(CHOOSE, { input: { pathId: "founder" } }, first.cookie)
        const other = await doors.ask<PathsBody>(PATHS, { input: { locale: "vi" } }, second.cookie)

        expect(other.data?.outcomePaths.activePathId).toBeNull()
    })

    it("answers PATH_NOT_FOUND for a path outside the catalog and keeps the path already followed", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)
        await doors.ask<ChooseBody>(CHOOSE, { input: { pathId: "founder" } }, cookie)

        const answer = await doors.ask(CHOOSE, { input: { pathId: "astronaut" } }, cookie)
        const listed = await doors.ask<PathsBody>(PATHS, { input: { locale: "vi" } }, cookie)

        expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "PATH_NOT_FOUND", kind: "not-found" })
        expect(listed.data?.outcomePaths.activePathId).toBe("founder")
    })
})
