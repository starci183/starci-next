import { Test } from "@nestjs/testing"
import { shapeIssues, type LessonShape } from "./shape.policy"

const SHAPE_POLICY: unique symbol = Symbol("lesson.shape-policy")

const build = async (): Promise<typeof shapeIssues> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SHAPE_POLICY, useFactory: () => shapeIssues }],
    }).compile()
    return moduleRef.get<typeof shapeIssues>(SHAPE_POLICY)
}

const SHAPE: LessonShape = {
    required: {
        name: "string",
        count: "positive",
        rank: "integer",
        done: "boolean",
        level: { oneOf: ["low", "high"] },
        tags: { items: "string" },
        inner: { required: { id: "string" } },
    },
    optional: { note: "string" },
}

const VALID = {
    name: "a",
    count: 1,
    rank: 0,
    done: false,
    level: "low",
    tags: ["x"],
    inner: { id: "i" },
}

describe("shapeIssues", () => {
    it("accepts a value that fits, with or without its optional members", async () => {
        const check = await build()

        expect(check(VALID, SHAPE)).toEqual([])
        expect(check({ ...VALID, note: "n" }, SHAPE)).toEqual([])
    })

    it("tolerates members the shape does not name", async () => {
        const check = await build()

        expect(check({ ...VALID, extra: 1 }, SHAPE)).toEqual([])
    })

    it("names each missing required member by its path", async () => {
        const check = await build()

        expect(check({ ...VALID, inner: {}, tags: [] }, { required: { gone: "string" } })).toEqual([
            { field: "gone", message: "is missing" },
        ])
        expect(check({}, { required: { inner: { required: { id: "string" } } } })).toEqual([
            { field: "inner", message: "is missing" },
        ])
        expect(check({ inner: {} }, { required: { inner: { required: { id: "string" } } } })).toEqual([
            { field: "inner.id", message: "is missing" },
        ])
    })

    it("names a wrong scalar, an empty text and a number out of range", async () => {
        const check = await build()
        const bad = { ...VALID, name: "", count: 0, rank: -1, done: "no" }

        expect(check(bad, SHAPE)).toEqual([
            { field: "name", message: "expected a text" },
            { field: "count", message: "expected a whole number from 1" },
            { field: "rank", message: "expected a whole number from 0" },
            { field: "done", message: "expected true or false" },
        ])
        expect(check({ ...VALID, count: 1.5 }, SHAPE)).toEqual([
            { field: "count", message: "expected a whole number from 1" },
        ])
    })

    it("names a value outside a closed set, a list that is not one and an item inside a list", async () => {
        const check = await build()

        expect(check({ ...VALID, level: "mid", tags: "x" }, SHAPE)).toEqual([
            { field: "level", message: "expected one of low, high" },
            { field: "tags", message: "expected a list" },
        ])
        expect(check({ ...VALID, level: 3, tags: ["ok", 2] }, SHAPE)).toEqual([
            { field: "level", message: "expected one of low, high" },
            { field: "tags[1]", message: "expected a text" },
        ])
    })

    it("names an object that is not one, at the root and inside, and a wrong optional member", async () => {
        const check = await build()

        expect(check("text", SHAPE)).toEqual([{ field: "", message: "expected an object" }])
        expect(check({ ...VALID, inner: null, note: 4 }, SHAPE)).toEqual([
            { field: "inner", message: "expected an object" },
            { field: "note", message: "expected a text" },
        ])
    })
})
