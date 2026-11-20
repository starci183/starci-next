import { useTestWorld } from "../../world/use-test-world"

/**
 * system-health: the real core app booted over the database the run migrated from db/migrations, called over HTTP. It answers
 * liveness and readiness once the schema is applied; readiness answers 503 while the database is cut and
 * liveness stays up.
 */
describe("system-health: the core app serves once its database is migrated (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    it("answers liveness and readiness over the migrated primary database", async () => {
        const live = await world.apps.core?.api.get("/health/live")
        const ready = await world.apps.core?.api.get("/health/ready")

        expect(live?.status).toBe(200)
        expect(ready?.status).toBe(200)
        expect(ready?.body).toEqual({ ok: true })
    })

    it("answers 503 on readiness while the database is cut, and liveness stays up", async () => {
        await world.interruptDatabase(async () => {
            const ready = await world.apps.core?.api.get("/health/ready")
            const live = await world.apps.core?.api.get("/health/live")

            expect(ready?.status).toBe(503)
            expect(live?.status).toBe(200)
        })
    })
})
