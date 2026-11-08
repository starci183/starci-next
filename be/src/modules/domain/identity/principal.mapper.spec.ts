import { Test } from "@nestjs/testing"
import { builder } from "@starci/jest-preset"
import { toPrincipal } from "./principal.mapper"
import type { IdentityPrincipal } from "./session.contracts"

const MAPPERS: unique symbol = Symbol("identity.principal-mappers")
interface PrincipalMappers {
    readonly toPrincipal: typeof toPrincipal
}
const identityOf = builder<IdentityPrincipal>({ subject: "learner-1", roles: [], displayName: null, email: null })

describe("principal mapping", () => {
    let subject: PrincipalMappers
    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: MAPPERS, useFactory: () => ({ toPrincipal }) }],
        }).compile()
        subject = moduleRef.get<PrincipalMappers>(MAPPERS)
    })
    it("carries the verified subject as the id of an authenticated caller", () => {
        expect(subject.toPrincipal(identityOf())).toEqual({ id: "learner-1", role: "authenticated" })
    })
    it("grants no role from the identity roles", () => {
        expect(subject.toPrincipal(identityOf({ roles: ["admin"] }))).toEqual({
            id: "learner-1",
            role: "authenticated",
        })
    })
})
