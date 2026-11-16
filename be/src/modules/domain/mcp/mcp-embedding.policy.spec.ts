import { EMBEDDING_DIMENSIONS, chunksOf, corpusKeyOf, cosineOf, truncatedUnitVectorOf } from "./mcp-embedding.policy"

describe("truncatedUnitVectorOf", () => {
    it("cuts 4096 dimensions to 1024 and scales to unit length", () => {
        const vector = truncatedUnitVectorOf(Array.from({ length: 4096 }, (_, index) => (index < 1024 ? 2 : 100)))
        expect(vector).toHaveLength(EMBEDDING_DIMENSIONS)
        expect(Math.sqrt((vector ?? []).reduce((sum, value) => sum + value * value, 0))).toBeCloseTo(1, 10)
    })

    it("refuses a short or all-zero vector", () => {
        expect(truncatedUnitVectorOf([1, 2, 3])).toBeNull()
        expect(truncatedUnitVectorOf(new Array<number>(4096).fill(0))).toBeNull()
    })
})

describe("cosineOf", () => {
    it("is 1 for the same unit vector and 0 for orthogonal ones", () => {
        expect(cosineOf([1, 0], [1, 0])).toBe(1)
        expect(cosineOf([1, 0], [0, 1])).toBe(0)
    })
})

describe("chunksOf", () => {
    it("cuts overlapping windows and drops blank ones", () => {
        const chunks = chunksOf("a.ts", Array.from({ length: 100 }, (_, index) => `l${index + 1}`).join("\n"))
        expect(chunks.map((chunk) => chunk.line)).toEqual([1, 33, 65])
        expect(chunksOf("a.ts", "\n\n  \n")).toEqual([])
    })
})

describe("corpusKeyOf", () => {
    it("names the same corpus by the same parts and another by different parts", () => {
        expect(corpusKeyOf(["a", "b"])).toBe(corpusKeyOf(["a", "b"]))
        expect(corpusKeyOf(["a", "b"])).not.toBe(corpusKeyOf(["a", "c"]))
    })
})
