import type { EntityManager } from "typeorm"
import { learnersOf, type Learner, type SessionBody } from "../../fixtures/builders/identity.builder"
import { SECRET, persistDemoLesson, persistDemoTopic, persistPremium } from "../../fixtures/builders/lesson.builder"
import { identityDoors, type IdentityDoors } from "../../world/identity-doors.client"
import { identityModules } from "../../world/identity-world.options"
import { useTestWorld } from "../../world/use-test-world"

interface GraphqlErrorExtensions {
    readonly code: string
    readonly kind: string
}

interface GraphqlError {
    readonly message: string
    readonly extensions: GraphqlErrorExtensions
}

interface GraphqlBody<T> {
    readonly data?: T | null
    readonly errors?: ReadonlyArray<GraphqlError>
}

interface CriterionBody {
    readonly criterion: string
}

interface OptionBody {
    readonly label: string
}

interface FileBody {
    readonly path: string
}

interface ActivityBody {
    readonly id: string
    readonly kind: string
    readonly criteria: ReadonlyArray<CriterionBody>
    readonly options: ReadonlyArray<OptionBody>
}

interface SectionBody {
    readonly id: string
    readonly phase: string
    readonly locked: boolean
    readonly body: string | null
    readonly activities: ReadonlyArray<ActivityBody>
}

interface WorkspaceBody {
    readonly runtime: string
    readonly files: ReadonlyArray<FileBody>
}

interface LessonRecordBody {
    readonly id: string
    readonly isPremium: boolean
    readonly sections: ReadonlyArray<SectionBody>
    readonly workspace: WorkspaceBody | null
}

interface LessonBody {
    readonly lesson: LessonRecordBody
}

interface TopicRefBody {
    readonly id: string
    readonly title: string
}

interface TopicStepBody {
    readonly order: number
    readonly title: string
    readonly lessonId: string | null
}

interface CatalogItemBody {
    readonly id: string
    readonly topic: TopicRefBody
    readonly group: string
    readonly title: string
    readonly languages: ReadonlyArray<string>
}

interface CatalogBody {
    readonly lessons: ReadonlyArray<CatalogItemBody>
}

const LESSON_QUERY = `query Lesson($input: LessonInput!) {
  lesson(input: $input) {
    id isPremium
    sections {
      id phase locked body
      activities { id kind criteria { criterion } options { label } simulation { initialStateId } exercise { submissionInstructions } }
    }
    workspace { runtime files { path } }
  }
}`

interface TopicPageBody {
    readonly id: string
    readonly path: ReadonlyArray<TopicStepBody>
}

interface TopicBody {
    readonly lessonTopic: TopicPageBody
}

const TOPIC_QUERY = `query Topic($input: LessonTopicInput!) {
  lessonTopic(input: $input) { id title group from description prerequisites related { id title listed } path { order title lessonId } }
}`

const CATALOG_QUERY = `query Lessons($input: LessonsInput!) {
  lessons(input: $input) { id title description category group topic { id title } difficulty minutes languages providers }
}`

/** Sends one GraphQL operation with the session cookie, when there is one. */
const askOf =
    (doors: IdentityDoors) =>
    <T>(query: string, variables: object, cookie?: string) =>
        doors.post<GraphqlBody<T>>("/graphql", { query, variables }, cookie === undefined ? {} : { cookie })

/** Signs a new learner in and gives them Premium until a future instant. */
const signInWithPremium = async (
    doors: IdentityDoors,
    manager: EntityManager | undefined,
    learner: Learner,
): Promise<string> => {
    const cookie = await doors.signIn(learner)
    const session = await doors.get<SessionBody>("/api/identity/session", { cookie })
    await persistPremium(manager, session.body.identity.subject)
    return cookie
}

/**
 * Lesson doors (integration): the `lessons` and `lesson` queries of the real core app behind the real session guard. It proves
 * a door needs a session, the catalog filters and the refusals of an unknown lesson and of a bad locale.
 */
describe("lesson catalog and refusals (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("b1")

    beforeEach(async () => {
        await doors().reset()
        await persistDemoLesson(world.db.primary)
        await persistDemoTopic(world.db.primary)
    })

    it.each([
        [CATALOG_QUERY, { input: { locale: "vi" } }],
        [LESSON_QUERY, { input: { id: "demo-lesson", locale: "vi" } }],
    ])("refuses a caller with no session", async (query, variables) => {
        const answer = await askOf(doors())(query, variables)

        expect(answer.body.data ?? null).toBeNull()
        expect(answer.body.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists the live lessons titled in the asked locale and narrowed by each filter", async () => {
        const cookie = await doors().signIn(nextLearner())
        const idsOf = async (input: object): Promise<Array<string>> =>
            ((await askOf(doors())<CatalogBody>(CATALOG_QUERY, { input }, cookie)).body.data?.lessons ?? []).map(
                (item) => item.id,
            )

        const english = await askOf(doors())<CatalogBody>(CATALOG_QUERY, { input: { locale: "en" } }, cookie)

        expect(english.body.data?.lessons.find((item) => item.id === "demo-lesson")).toMatchObject({
            title: "en: Demo lesson",
            group: "backend",
            topic: { id: "demo-topic", title: "Demo topic" },
            languages: ["typescript"],
        })
        await expect(
            idsOf({
                locale: "vi",
                category: "backend",
                difficulty: "intermediate",
                language: "typescript",
                q: "DEMO",
            }),
        ).resolves.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", group: "backend", topic: "demo-topic" })).resolves.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", group: "infra" })).resolves.not.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", topic: "kubernetes" })).resolves.not.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", category: "devops" })).resolves.not.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", provider: "aws" })).resolves.not.toContain("demo-lesson")
        await expect(idsOf({ locale: "vi", q: "no such words" })).resolves.not.toContain("demo-lesson")
    })
})

/** Lesson topic page (integration): the path of a topic linked to its published lessons. */
describe("lesson topic page (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("b3")

    beforeEach(async () => {
        await doors().reset()
        await persistDemoLesson(world.db.primary)
        await persistDemoTopic(world.db.primary)
    })

    it("reads a topic page with its path linked to the published lesson and the copy of the topic", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())<TopicBody>(
            TOPIC_QUERY,
            { input: { topic: "demo-topic", locale: "vi" } },
            cookie,
        )

        expect(answer.body.errors).toBeUndefined()
        expect(answer.body.data?.lessonTopic).toEqual({
            id: "demo-topic",
            title: "Demo topic",
            group: "backend",
            from: "Demo course module 0",
            description: "About the demo topic.",
            prerequisites: ["Know the demo."],
            related: [{ id: "plain-topic", title: "plain-topic", listed: false }],
            path: [
                { order: 1, title: "vi: Step 0.0", lessonId: null },
                { order: 2, title: "vi: Step 0.1", lessonId: "demo-lesson" },
            ],
        })
    })

    it("answers LESSON_TOPIC_NOT_FOUND for a topic nobody stored", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())(TOPIC_QUERY, { input: { topic: "no-such-topic", locale: "vi" } }, cookie)

        expect(answer.body.errors?.[0]?.extensions).toMatchObject({ code: "LESSON_TOPIC_NOT_FOUND", kind: "not-found" })
    })
})

describe("lesson refusals (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("b4")

    beforeEach(async () => {
        await doors().reset()
        await persistDemoLesson(world.db.primary)
        await persistDemoTopic(world.db.primary)
    })

    it("answers LESSON_NOT_FOUND for a lesson that is not live", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())(LESSON_QUERY, { input: { id: "no-such-lesson", locale: "vi" } }, cookie)

        expect(answer.body.errors?.[0]?.extensions).toMatchObject({ code: "LESSON_NOT_FOUND", kind: "not-found" })
    })

    it("refuses an unsupported locale as invalid input", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())(LESSON_QUERY, { input: { id: "demo-lesson", locale: "fr" } }, cookie)

        expect(answer.body.errors?.[0]?.extensions.kind).toBe("invalid")
    })
})

/**
 * Lesson doors, the Premium gate (integration): the locked phases without Premium, the open phases with it, and no answer, rubric
 * evidence or option correctness in any response before a submit.
 */
describe("lesson premium gate (integration)", () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = () => identityDoors(world)
    const nextLearner = learnersOf("b2")

    beforeEach(async () => {
        await doors().reset()
        await persistDemoLesson(world.db.primary)
        await persistDemoTopic(world.db.primary)
    })

    it("opens the overview and the challenge phase and locks every other phase for a learner without Premium", async () => {
        const cookie = await doors().signIn(nextLearner())

        const answer = await askOf(doors())<LessonBody>(
            LESSON_QUERY,
            { input: { id: "demo-lesson", locale: "vi" } },
            cookie,
        )
        const lesson = answer.body.data?.lesson

        expect(answer.body.errors).toBeUndefined()
        expect(lesson?.isPremium).toBe(false)
        expect(
            lesson?.sections.map((section) => [
                section.phase,
                section.locked,
                section.body === null,
                section.activities.length,
            ]),
        ).toEqual([
            ["challenge", false, false, 1],
            ["predict", true, true, 0],
            ["explore", true, true, 0],
            ["explain", true, true, 0],
            ["apply", true, true, 0],
            ["reflect", true, true, 0],
        ])
        expect(lesson?.workspace).toBeNull()
    })

    it("opens every phase and the lab workspace for a learner with Premium", async () => {
        const cookie = await signInWithPremium(doors(), world.db.primary, nextLearner())

        const answer = await askOf(doors())<LessonBody>(
            LESSON_QUERY,
            { input: { id: "demo-lesson", locale: "en" } },
            cookie,
        )
        const lesson = answer.body.data?.lesson

        expect(lesson?.isPremium).toBe(true)
        expect(lesson?.sections.every((section) => !section.locked && section.body !== null)).toBe(true)
        expect(lesson?.workspace?.files.map((file) => file.path)).toEqual([
            "workspace/source.test.ts",
            "workspace/source.ts",
        ])
    })

    it.each([false, true])(
        "never carries an answer, evidence, correctness or hint before a submit (premium %s)",
        async (premium) => {
            const cookie = premium
                ? await signInWithPremium(doors(), world.db.primary, nextLearner())
                : await doors().signIn(nextLearner())

            const answer = await askOf(doors())<LessonBody>(
                LESSON_QUERY,
                { input: { id: "demo-lesson", locale: "vi" } },
                cookie,
            )
            const text = JSON.stringify(answer.body)

            expect(text).not.toContain(SECRET)
            expect(text).not.toMatch(/isCorrect|expectedEvidence|misconception|sampleAnswer|hints/u)
            expect(text).toContain("vi: Mechanism")
        },
    )
})
