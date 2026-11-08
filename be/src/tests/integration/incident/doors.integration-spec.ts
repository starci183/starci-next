import { learnersOf } from "../../fixtures/builders/identity.builder"
import { persistDemoLesson, persistDemoTopic } from "../../fixtures/builders/lesson.builder"
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

interface IncidentBody {
    readonly lessonId: string
    readonly title: string
    readonly topicId: string
    readonly incidentAvailable: boolean
    readonly status: string
}

interface IncidentsBody {
    readonly incidents: ReadonlyArray<IncidentBody>
}

const INCIDENTS_QUERY = `query Incidents($input: IncidentsInput!) {
  incidents(input: $input) { lessonId title topicId topicTitle group difficulty minutes incidentAvailable status }
}`

const askOf =
    (doors: IdentityDoors) =>
    <T>(variables: object, cookie?: string) =>
        doors.post<GraphqlBody<T>>(
            "/graphql",
            { query: INCIDENTS_QUERY, variables },
            cookie === undefined ? {} : { cookie },
        )

/**
 * Incident list door (integration): the `incidents` query of the real core app behind the real session guard. No incident is
 * authored yet, so every live lesson is listed as coming soon.
 */
describe("incident list door (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("c2")

    beforeEach(async () => {
        await doors().reset()
        await persistDemoLesson(world.db.primary)
        await persistDemoTopic(world.db.primary)
    })

    it("refuses a caller with no session", async () => {
        const answer = await askOf(doors())({ input: { locale: "vi" } })

        expect(answer.body.data ?? null).toBeNull()
        expect(answer.body.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists a live lesson as a coming-soon incident in the asked locale", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())<IncidentsBody>({ input: { locale: "en" } }, cookie)

        expect(answer.body.errors).toBeUndefined()
        expect(answer.body.data?.incidents.find((row) => row.lessonId === "demo-lesson")).toMatchObject({
            title: "en: Demo lesson",
            topicId: "demo-topic",
            incidentAvailable: false,
            status: "coming-soon",
        })
        expect(answer.body.data?.incidents.every((row) => !row.incidentAvailable)).toBe(true)
    })

    it("narrows the list to a topic", async () => {
        const cookie = await doors().signIn(nextLearner())

        const inTopic = await askOf(doors())<IncidentsBody>({ input: { locale: "vi", topic: "demo-topic" } }, cookie)
        const elsewhere = await askOf(doors())<IncidentsBody>({ input: { locale: "vi", topic: "kubernetes" } }, cookie)

        expect(inTopic.body.data?.incidents.map((row) => row.lessonId)).toContain("demo-lesson")
        expect(elsewhere.body.data?.incidents.map((row) => row.lessonId)).not.toContain("demo-lesson")
    })
})
