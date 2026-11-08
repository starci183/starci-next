import { Test } from "@nestjs/testing"
import {
    DEFAULT_CONCURRENCY,
    DEFAULT_FREE_PER_PATTERN,
    DEFAULT_MAX_SOURCE_BYTES,
    DEFAULT_SUBMISSIONS_PER_MINUTE,
    DEFAULT_WAIT_MS,
} from "./practice.config"
import * as subject from "./practice-settings.policy"

const SUBJECT: unique symbol = Symbol("practice.practice-settings.policy")

describe("settingsOf", () => {
    let settingsOf: typeof subject.settingsOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ settingsOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("gives every setting its default when the app named none", () => {
        expect(settingsOf({})).toEqual({
            freePerPattern: DEFAULT_FREE_PER_PATTERN,
            concurrency: DEFAULT_CONCURRENCY,
            submissionsPerMinute: DEFAULT_SUBMISSIONS_PER_MINUTE,
            maxSourceBytes: DEFAULT_MAX_SOURCE_BYTES,
            waitMs: DEFAULT_WAIT_MS,
        })
    })

    it("keeps the values the app named, a free count of 0 included", () => {
        expect(
            settingsOf({ freePerPattern: 0, concurrency: 2, submissionsPerMinute: 3, maxSourceBytes: 100, waitMs: 50 }),
        ).toEqual({ freePerPattern: 0, concurrency: 2, submissionsPerMinute: 3, maxSourceBytes: 100, waitMs: 50 })
    })
})
