import { appliedMigrations, PRIMARY_APPLIED_MIGRATIONS } from "../../../fixtures/persistence/migrations.sql"
import { useTestWorld } from "../../../world/use-test-world"

/**
 * lesson-ai-pool: the real core app booted with the shared lesson pool composed from named key custody. The pool is
 * registered at the app root (`options.aiPool` parsed from `LESSON_AI_*` environment references), so a serving app is
 * the observable proof of the composition; custody values stay behind the environment and never reach a door or a
 * response body.
 */
describe("lesson AI pool: the core app composes the shared pool (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    it("serves liveness and readiness with the pool composed from named custody references", async () => {
        const live = await world.apps.core.api.get("/health/live")
        const ready = await world.apps.core.api.get("/health/ready")
        const applied = await appliedMigrations(world.db.primary, PRIMARY_APPLIED_MIGRATIONS)

        expect(live.status).toBe(200)
        expect(ready.status).toBe(200)
        expect(ready.body).toEqual({ ok: true })
        expect(applied.length).toBeGreaterThan(0)
        expect(JSON.stringify(live.body)).not.toContain("test-placeholder")
        expect(JSON.stringify(ready.body)).not.toContain("test-placeholder")
    })

    it("serves again after a restart with the same custody references and the same migrated store", async () => {
        await world.apps.core.restart()

        const live = await world.apps.core.api.get("/health/live")
        const applied = await appliedMigrations(world.db.primary, PRIMARY_APPLIED_MIGRATIONS)

        expect(live.status).toBe(200)
        expect(applied.length).toBeGreaterThan(0)
    })
})
