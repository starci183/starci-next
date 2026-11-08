import type { EntityManager } from "typeorm"
import { learnersOf, type Learner, type SessionBody } from "../../fixtures/builders/identity.builder"
import { persistPremium } from "../../fixtures/builders/lesson.builder"
import { identityDoors, type IdentityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface GraphqlErrorExtensions {
    readonly code: string
    readonly kind: string
}

interface GraphqlErrorBody {
    readonly extensions: GraphqlErrorExtensions
}

interface GraphqlBody<T> {
    readonly data?: T | null
    readonly errors?: ReadonlyArray<GraphqlErrorBody>
}

interface TrackSummaryBody {
    readonly id: string
    readonly keyMode: string
    readonly pinnedVersion: string | null
    readonly labCount: number
    readonly openLabCount: number
}

interface ConceptBody {
    readonly id: string
    readonly label: string
    readonly free: boolean
}

interface OverviewBodyData {
    readonly tracks: ReadonlyArray<TrackSummaryBody>
    readonly concepts: ReadonlyArray<ConceptBody>
}

interface OverviewBody {
    readonly agentLab: OverviewBodyData
}

interface CellBody {
    readonly conceptId: string
    readonly status: string
    readonly locked: boolean
    readonly open: boolean
    readonly steps: ReadonlyArray<unknown>
}

interface TrackBodyData extends TrackSummaryBody {
    readonly cells: ReadonlyArray<CellBody>
}

interface TrackBody {
    readonly agentLabTrack: TrackBodyData
}

const OVERVIEW_QUERY = `query AgentLab($input: AgentLabInput!) {
  agentLab(input: $input) { tracks { id keyMode pinnedVersion labCount openLabCount } concepts { id label free } }
}`

const TRACK_QUERY = `query AgentLabTrack($input: AgentLabTrackInput!) {
  agentLabTrack(input: $input) { id keyMode pinnedVersion labCount openLabCount cells { conceptId status locked open steps { text } } }
}`

const askOf =
    (doors: IdentityDoors) =>
    <T>(query: string, variables: object, cookie?: string) =>
        doors.post<GraphqlBody<T>>("/graphql", { query, variables }, cookie === undefined ? {} : { cookie })

const trackOf = (doors: IdentityDoors, cookie: string, trackId: string) =>
    askOf(doors)<TrackBody>(TRACK_QUERY, { input: { trackId, locale: "vi" } }, cookie)

const subjectOf = async (doors: IdentityDoors, cookie: string): Promise<string> =>
    (await doors.get<SessionBody>("/api/identity/session", { cookie })).body.identity.subject

/** Signs a new learner in and gives them Premium until a future instant. */
const signInWithPremium = async (
    doors: IdentityDoors,
    manager: EntityManager | undefined,
    learner: Learner,
): Promise<string> => {
    const cookie = await doors.signIn(learner)
    await persistPremium(manager, await subjectOf(doors, cookie))
    return cookie
}

/**
 * Agent lab doors (integration): `agentLab` and `agentLabTrack` of the real core app behind the real session
 * guard. No lab is written yet, so every cell is being written.
 */
describe("agent lab doors (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("c1")

    beforeEach(async () => {
        await doors().reset()
    })

    it.each([
        [OVERVIEW_QUERY, { input: { locale: "vi" } }],
        [TRACK_QUERY, { input: { trackId: "claude", locale: "vi" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await askOf(doors())(query, variables)

        expect(answer.body.data ?? null).toBeNull()
        expect(answer.body.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists the three tracks and the seven mindset concepts with no lab written", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())<OverviewBody>(OVERVIEW_QUERY, { input: { locale: "en" } }, cookie)

        expect(answer.body.errors).toBeUndefined()
        expect(answer.body.data?.agentLab.tracks).toEqual([
            { id: "claude", keyMode: "byo", pinnedVersion: null, labCount: 0, openLabCount: 0 },
            { id: "openclaw", keyMode: "starci-proxy", pinnedVersion: null, labCount: 0, openLabCount: 0 },
            { id: "hermes", keyMode: "starci-proxy", pinnedVersion: null, labCount: 0, openLabCount: 0 },
        ])
        expect(answer.body.data?.agentLab.concepts.map((concept) => concept.id)).toEqual([
            "task-spec",
            "context",
            "tools-permissions",
            "verify",
            "decompose",
            "cost-limits",
            "operate",
        ])
        expect(answer.body.data?.agentLab.concepts[0]).toMatchObject({ label: "Clear task spec", free: true })
    })

    it("reads a track as seven being-written cells, the later six locked without Premium", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await trackOf(doors(), cookie, "openclaw")

        const cells = answer.body.data?.agentLabTrack.cells ?? []
        expect(cells).toHaveLength(7)
        expect(cells.every((cell) => cell.status === "being-written" && !cell.open && cell.steps.length === 0)).toBe(
            true,
        )
        expect(cells.map((cell) => cell.locked)).toEqual([false, true, true, true, true, true, true])
    })

    it("unlocks the later cells for a Premium learner", async () => {
        const cookie = await signInWithPremium(doors(), world.db.primary, nextLearner())

        const answer = await trackOf(doors(), cookie, "hermes")

        expect(answer.body.data?.agentLabTrack.cells.some((cell) => cell.locked)).toBe(false)
    })

    it("answers AGENT_LAB_TRACK_NOT_FOUND for an unknown track", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await trackOf(doors(), cookie, "orca")

        expect(answer.body.errors?.[0]?.extensions).toMatchObject({
            code: "AGENT_LAB_TRACK_NOT_FOUND",
            kind: "not-found",
        })
    })
})
