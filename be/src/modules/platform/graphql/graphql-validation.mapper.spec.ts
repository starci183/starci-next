import { Test } from "@nestjs/testing"
import { requestInvalidOf } from "./graphql-validation.mapper"

const MAPPER: unique symbol = Symbol("graphql.validation-mapper")

const build = async (): Promise<typeof requestInvalidOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: MAPPER, useFactory: () => requestInvalidOf }],
    }).compile()
    return moduleRef.get<typeof requestInvalidOf>(MAPPER)
}

const formattedWith = (code?: string) => ({
    message: 'Cannot query field "nope" on type "Query". Did you mean "me"?',
    ...(code === undefined ? {} : { extensions: { code } }),
})

describe("requestInvalidOf", () => {
    it.each(["GRAPHQL_PARSE_FAILED", "GRAPHQL_VALIDATION_FAILED", "BAD_USER_INPUT"])(
        "answers the request-invalid error of a %s failure with a neutral field and no original message",
        async (code) => {
            const requestInvalidOf = await build()
            const cause = new Error("schema detail")
            const error = requestInvalidOf(formattedWith(code), cause)

            expect(error).toMatchObject({
                code: "HTTP_SECURITY_REQUEST_INVALID",
                params: { fields: "operation" },
                cause,
            })
            expect(JSON.stringify(error?.params)).not.toContain("Did you mean")
        },
    )

    it("reads the code from the failure when the formatted error does not carry one", async () => {
        const requestInvalidOf = await build()
        const error = requestInvalidOf(formattedWith(), { extensions: { code: "GRAPHQL_VALIDATION_FAILED" } })

        expect(error).toMatchObject({ code: "HTTP_SECURITY_REQUEST_INVALID" })
    })

    it("passes an unrelated coded error and an unexpected error through unchanged", async () => {
        const requestInvalidOf = await build()
        expect(requestInvalidOf(formattedWith("INTERNAL_SERVER_ERROR"), new Error("boom"))).toBeUndefined()
        expect(requestInvalidOf(formattedWith("UNAUTHENTICATED"), undefined)).toBeUndefined()
        expect(requestInvalidOf(formattedWith(), new Error("boom"))).toBeUndefined()
        expect(requestInvalidOf(formattedWith(), "text")).toBeUndefined()
        expect(requestInvalidOf(formattedWith(), { extensions: {} })).toBeUndefined()
    })
})
