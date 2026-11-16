import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { checkSetOf } from "./project-check-set.policy"

const CHECKS = join(__dirname, "..", "..", "..", "tests", "fixtures", "project-checks")
const catalog = readFileSync(join(CHECKS, "catalog.yaml"), "utf8")
const probes = Object.fromEntries(
    readdirSync(join(CHECKS, "probes")).map((name) => [name, readFileSync(join(CHECKS, "probes", name), "utf8")]),
)

describe("checkSetOf", () => {
    it("reads the catalog and every probe flow of the content as data", () => {
        const set = checkSetOf({ version: "v1", catalog, probes })

        expect(set.kinds.app).toEqual(["bf-http-foundation", "bf-data-and-cache", "bf-safe-and-reliable"])
        const app = new Set(set.milestones.filter((m) => set.kinds.app.includes(m.id)).flatMap((m) => m.concepts))
        expect(app.size).toBe(10)
        expect(set.probes.get("owner-only")?.flow.steps.length).toBe(5)
        expect(set.concepts.find((concept) => concept.id === "transactional-outbox")).toMatchObject({
            kind: "behaviour",
            http: true,
            probes: ["outbox-delivery"],
        })
    })

    it("refuses the whole set when a concept names a probe with no file, or a flow breaks the schema", () => {
        const { "burst.yaml": _burst, ...withoutBurst } = probes
        expect(() => checkSetOf({ version: "v1", catalog, probes: withoutBurst })).toThrow("PROJECT_CHECKS_UNAVAILABLE")
        const broken = String(probes["health.yaml"]).replace("that: status", "that: nonsense")
        expect(() => checkSetOf({ version: "v1", catalog, probes: { ...probes, "health.yaml": broken } })).toThrow(
            "PROJECT_CHECKS_UNAVAILABLE",
        )
    })
})
