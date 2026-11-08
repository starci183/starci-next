import { Test } from "@nestjs/testing"
import { buildSchema, parse, validate } from "graphql"
import { operationLimitsRule, type OperationLimits } from "./graphql-depth.policy"

const schema = buildSchema(`
    type Query {
        item: Item
    }

    type Mutation {
        start: Item
        stop: Item
    }

    type Item {
        value: String
        child: Item
    }
`)

const LIMITS = Symbol("spec.operation-limits-rule")

/** The bounds the cases run under, by name. */
const LIMIT_SETS = {
    tight: { maxDepth: 2, maxFields: 6, maxRootMutations: 1 },
    deep: { maxDepth: 3, maxFields: 50, maxRootMutations: 1 },
    threeFields: { maxDepth: 10, maxFields: 3, maxRootMutations: 1 },
    fourFields: { maxDepth: 10, maxFields: 4, maxRootMutations: 1 },
    fiveFields: { maxDepth: 10, maxFields: 5, maxRootMutations: 1 },
} as const satisfies Record<string, OperationLimits>

const build = async (name: keyof typeof LIMIT_SETS = "tight") => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: LIMITS, useFactory: () => ({ rule: operationLimitsRule }) }],
    }).compile()
    const { rule } = moduleRef.get<{ readonly rule: typeof operationLimitsRule }>(LIMITS)
    return (source: string) => validate(schema, parse(source), [rule(LIMIT_SETS[name])]).map((error) => error.message)
}

describe("operationLimitsRule depth", () => {
    it("accepts an operation nested exactly to the depth limit", async () => {
        const check = await build()

        expect(check(`query { item { value } }`)).toEqual([])
    })

    it("rejects an operation nested deeper than the limit", async () => {
        const check = await build()

        expect(check(`query { item { child { value } } }`)).toEqual(["Selection depth exceeds 2."])
    })

    it("counts the depth through chained fragments, so fragments cannot restart it", async () => {
        const check = await build()

        expect(
            check(`
                query { item { ...A } }
                fragment A on Item { child { ...B } }
                fragment B on Item { value }
            `),
        ).toEqual(["Selection depth exceeds 2."])
    })

    it("leaves an unknown fragment to the standard rules and stops a fragment cycle on its path", async () => {
        const check = await build("deep")

        expect(check(`query { item { ...Missing } }`)).toEqual([])
        expect(
            check(`
                query { item { ...A } }
                fragment A on Item { child { value ...A } }
            `),
        ).toEqual([])
    })

    it("does not count an inline fragment as a level of its own", async () => {
        const check = await build()

        expect(check(`query { item { ... on Item { value } } }`)).toEqual([])
    })
})

describe("operationLimitsRule fields", () => {
    it("rejects an operation whose aliases repeat a field past the field limit", async () => {
        const check = await build("threeFields")

        expect(check(`query { a: item { value } b: item { value } }`)).toEqual(["Selected fields exceed 3."])
    })

    it("counts every use of a fragment", async () => {
        const check = await build("fiveFields")

        expect(
            check(`
                query { a: item { ...F } b: item { ...F } }
                fragment F on Item { value child { value } }
            `),
        ).toEqual(["Selected fields exceed 5."])
    })

    it("accepts an operation at the field limit", async () => {
        const check = await build("fourFields")

        expect(check(`query { a: item { value } b: item { value } }`)).toEqual([])
    })
})

describe("operationLimitsRule mutations", () => {
    it("accepts one root mutation field and rejects aliased or fragment-spread repeats", async () => {
        const check = await build()

        expect(check(`mutation { start { value } }`)).toEqual([])
        expect(check(`mutation { a: start { value } b: start { value } }`)).toEqual([
            "A mutation may select at most 1 root field.",
        ])
        expect(
            check(`
                mutation { start { value } ...M }
                fragment M on Mutation { stop { value } }
            `),
        ).toEqual(["A mutation may select at most 1 root field."])
    })

    it("counts root fields inside an inline fragment, and skips unknown or cyclic fragments", async () => {
        const check = await build()

        expect(check(`mutation { ... on Mutation { start { value } } stop { value } }`)).toEqual([
            "A mutation may select at most 1 root field.",
        ])
        expect(check(`mutation { start { value } ...Missing }`)).toEqual([])
        expect(
            check(`
                mutation { ...M }
                fragment M on Mutation { start { value } ...M }
            `),
        ).toEqual([])
    })

    it("does not limit the root fields of a query", async () => {
        const check = await build()

        expect(check(`query { a: item { value } b: item { value } }`)).toEqual([])
    })
})
