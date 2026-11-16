import { DEFAULT_ESSENTIAL_FREE_PARTS } from "./entitlement.contracts"
import { parseEntitlementConfig } from "./entitlement.config"
import { essentialFreePartsOf, lockedEssentialPartsOf, openEssentialPartsOf } from "./entitlement-essential.policy"

const envOf = (values: Record<string, string>) => ({
    optional: (key: string): string | undefined => (values[key] === "" ? undefined : values[key]),
    bool: (key: string, fallback?: boolean): boolean =>
        values[key] === undefined ? (fallback ?? false) : values[key] === "true",
})

describe("essential free parts", () => {
    it("leaves only Bản chất free when nothing is set", () => {
        expect(DEFAULT_ESSENTIAL_FREE_PARTS).toEqual(["1-essential"])
        expect(essentialFreePartsOf({})).toEqual(["1-essential"])
    })

    it("takes the app's setting over the default, even an empty one", () => {
        expect(essentialFreePartsOf({ essentialFreeParts: ["1-essential", "2-source"] })).toEqual([
            "1-essential",
            "2-source",
        ])
        expect(essentialFreePartsOf({ essentialFreeParts: [] })).toEqual([])
    })

    it("opens every part with Premium and the free parts without", () => {
        const free = essentialFreePartsOf({})
        expect(openEssentialPartsOf(free, true)).toEqual(["1-essential", "2-source", "3-scenarios", "4-apply"])
        expect(openEssentialPartsOf(free, false)).toEqual(["1-essential"])
        expect(lockedEssentialPartsOf(openEssentialPartsOf(free, false))).toEqual([
            "2-source",
            "3-scenarios",
            "4-apply",
        ])
        expect(lockedEssentialPartsOf(openEssentialPartsOf(free, true))).toEqual([])
    })
})

describe("parseEntitlementConfig essential free parts", () => {
    it("defaults to Bản chất when ENTITLEMENT_ESSENTIAL_FREE_PARTS is undeclared", () => {
        expect(parseEntitlementConfig(envOf({}) as never).essentialFreeParts).toEqual(["1-essential"])
    })

    it("reads a comma-separated list and the word none", () => {
        const parse = (value: string) =>
            parseEntitlementConfig(envOf({ ENTITLEMENT_ESSENTIAL_FREE_PARTS: value }) as never)
        expect(parse("1-essential, 2-source").essentialFreeParts).toEqual(["1-essential", "2-source"])
        expect(parse("none").essentialFreeParts).toEqual([])
    })

    it("refuses an id that is not one of the four parts at boot", () => {
        expect(() =>
            parseEntitlementConfig(envOf({ ENTITLEMENT_ESSENTIAL_FREE_PARTS: "1-essential,5-extra" }) as never),
        ).toThrow(/5-extra/u)
    })
})
