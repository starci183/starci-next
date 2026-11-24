import { RELAY_LAB_CONTRACT } from "@modules/domain/relay"
import { CourseLabContractAdapter } from "./course-lab-contract.adapter"
import { CourseModule } from "./course.module"

describe("CourseModule", () => {
    const registered = CourseModule.register({ isGlobal: true })

    it("is global, as the app root decides", () => {
        expect(registered.global).toBe(true)
    })

    it("answers the relay's lab contract port with the contract adapter and exports the token, so the relay's optional injection finds it", () => {
        expect(registered.providers).toEqual(
            expect.arrayContaining([CourseLabContractAdapter, { provide: RELAY_LAB_CONTRACT, useExisting: CourseLabContractAdapter }]),
        )
        expect(registered.exports).toContain(RELAY_LAB_CONTRACT)
    })
})
