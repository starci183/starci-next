import * as statements from "./mcp.sql"

describe("the mcp statements", () => {
    it("never answer a bare UPDATE or DELETE with RETURNING, which the driver returns as [rows, count] and not as rows", () => {
        const returning = Object.entries(statements).filter(([, statement]) => String(statement).includes("RETURNING"))
        expect(returning.length).toBeGreaterThan(3)
        for (const [name, statement] of returning)
            expect({ name, bare: /^\s*(UPDATE|DELETE)\b/iu.test(String(statement)) }).toEqual({ name, bare: false })
    })
})
