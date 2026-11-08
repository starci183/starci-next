import { Test } from "@nestjs/testing"
import {
    inPool,
    inTrack,
    likePatternsOf,
    matchesBank,
    offersTier,
    patternsOf,
    tracksOf,
    type TrackDefinition,
} from "./track.policy"

/** The functions under test, provided the way Nest provides them so the spec builds its subject from a testing module. */
const SUBJECT = { inPool, inTrack, likePatternsOf, matchesBank, offersTier, patternsOf, tracksOf }

/** The token the testing module provides the functions under. */
const SUBJECT_TOKEN: unique symbol = Symbol("interview.track.policy")

/** Builds the functions under test from a testing module. */
const loadSubject = async (): Promise<typeof SUBJECT> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SUBJECT_TOKEN, useFactory: () => SUBJECT }],
    }).compile()
    return moduleRef.get<typeof SUBJECT>(SUBJECT_TOKEN)
}

const FRAMEWORK = "0-fullstack-mastery/0-framework-foundation"
const DATABASE = "0-fullstack-mastery/1-database-integration-and-caching"
const LATE = "0-fullstack-mastery/9-background-jobs-and-workers"

describe("track policy", () => {
    let subject: typeof SUBJECT
    let fullstack: TrackDefinition | undefined
    let widened: TrackDefinition | undefined
    let design: TrackDefinition | undefined

    beforeAll(async () => {
        subject = await loadSubject()
        const mvp = subject.tracksOf("mvp")
        fullstack = mvp.find((track) => track.id === "backend-fullstack")
        widened = subject.tracksOf("widened").find((track) => track.id === "backend-fullstack")
        design = mvp.find((track) => track.id === "system-design-senior")
    })

    it("matches a bank by exact id or by prefix", () => {
        expect(subject.matchesBank(FRAMEWORK, FRAMEWORK)).toBe(true)
        expect(subject.matchesBank("eq/*", "eq/1-behavioral")).toBe(true)
        expect(subject.matchesBank("eq/*", FRAMEWORK)).toBe(false)
        expect(subject.matchesBank(FRAMEWORK, DATABASE)).toBe(false)
    })

    it("lets a junior Fullstack learner draw across the first three banks and the others from the foundation bank alone (Q-MI-1)", () => {
        expect(fullstack && subject.inPool(fullstack, "technical", "junior", DATABASE)).toBe(true)
        expect(fullstack && subject.inPool(fullstack, "technical", "middle", DATABASE)).toBe(false)
        expect(fullstack && subject.inPool(fullstack, "technical", "senior", FRAMEWORK)).toBe(true)
        expect(fullstack && subject.inPool(fullstack, "behavioral", "senior", "eq/1-behavioral")).toBe(true)
        expect(fullstack && subject.patternsOf(fullstack, "technical", "middle")).toEqual([FRAMEWORK])
    })

    it("widens the Fullstack pool to every bank of the course", () => {
        expect(widened && subject.inPool(widened, "technical", "senior", LATE)).toBe(true)
    })

    it("offers a tier unless the track limits them, and knows which banks belong to a track at any tier", () => {
        expect(design && subject.offersTier(design, "junior")).toBe(false)
        expect(design && subject.offersTier(design, "senior")).toBe(true)
        expect(fullstack && subject.offersTier(fullstack, "junior")).toBe(true)
        expect(fullstack && subject.inTrack(fullstack, "technical", DATABASE)).toBe(true)
        expect(fullstack && subject.inTrack(fullstack, "technical", LATE)).toBe(false)
        expect(fullstack && subject.inTrack(fullstack, "behavioral", "eq/3-culture")).toBe(true)
        expect(design && subject.inTrack(design, "technical", "1-system-design-mastery/4-caching")).toBe(true)
    })

    it("turns bank patterns into LIKE patterns for the database", () => {
        expect(fullstack && subject.likePatternsOf(fullstack, "junior")).toEqual([
            FRAMEWORK,
            DATABASE,
            "0-fullstack-mastery/2-rest-api-design-and-documentation",
            "eq/%",
        ])
    })
})
