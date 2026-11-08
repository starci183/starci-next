import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { GraphQLError } from "graphql"
import { ERRORS_SERVICE } from "./errors.decorators"
import type { ErrorsService } from "./errors.service"
import { formatGraphqlError } from "./graphql-error.mapper"

const formatted = { message: "raw", path: ["item"], locations: [{ line: 1, column: 3 }] }

const build = async () => {
    const double = mock<ErrorsService>()
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ERRORS_SERVICE, useValue: double }],
    }).compile()
    return moduleRef.get<typeof double>(ERRORS_SERVICE)
}

describe("formatGraphqlError", () => {
    it("masks a GraphQL error without an original failure as internal, never keeping its message", async () => {
        const errors = await build()
        errors.describe.mockReturnValue({ code: "ERRORS_INTERNAL", kind: "internal", status: 500, params: {} })

        expect(formatGraphqlError(errors, formatted, new GraphQLError("GRAPHQL_VALIDATION_FAILED"))).toEqual({
            message: "ERRORS_INTERNAL",
            path: ["item"],
            locations: [{ line: 1, column: 3 }],
            extensions: { code: "ERRORS_INTERNAL", kind: "internal", params: {} },
        })
        expect(errors.describe).toHaveBeenCalledWith(undefined)
    })

    it("describes the original failure of a resolver and travels its code, kind and params", async () => {
        const errors = await build()
        const cause = new Error("not found")
        errors.describe.mockReturnValue({
            code: "ITEM_NOT_FOUND",
            kind: "not-found",
            status: 404,
            params: { id: "i-1" },
        })

        expect(formatGraphqlError(errors, formatted, new GraphQLError("wrapped", { originalError: cause }))).toEqual({
            message: "ITEM_NOT_FOUND",
            path: ["item"],
            locations: [{ line: 1, column: 3 }],
            extensions: { code: "ITEM_NOT_FOUND", kind: "not-found", params: { id: "i-1" } },
        })
        expect(errors.describe).toHaveBeenCalledWith(cause)
    })

    it("describes a failure that is not a GraphQL error as it is", async () => {
        const errors = await build()
        const cause = new Error("boom")
        errors.describe.mockReturnValue({ code: "ERRORS_INTERNAL", kind: "internal", status: 500, params: {} })

        expect(formatGraphqlError(errors, formatted, cause).extensions).toEqual({
            code: "ERRORS_INTERNAL",
            kind: "internal",
            params: {},
        })
        expect(errors.describe).toHaveBeenCalledWith(cause)
    })

    it("leaves out the locations and path a formatted error does not carry", async () => {
        const subject = formatGraphqlError
        const errors = await build()
        errors.describe.mockReturnValue({ code: "ERRORS_INTERNAL", kind: "internal", status: 500, params: {} })

        expect(subject(errors, { message: "raw" }, new GraphQLError("GRAPHQL_PARSE_FAILED"))).toEqual({
            message: "ERRORS_INTERNAL",
            extensions: { code: "ERRORS_INTERNAL", kind: "internal", params: {} },
        })
        expect(subject(errors, { message: "raw" }, new Error("boom"))).toEqual({
            message: "ERRORS_INTERNAL",
            extensions: { code: "ERRORS_INTERNAL", kind: "internal", params: {} },
        })
    })

    it("travels the retryAfterSeconds param of a rate-limited failure in the extensions", async () => {
        const errors = await build()
        errors.describe.mockReturnValue({
            code: "HTTP_SECURITY_RATE_LIMITED",
            kind: "rate-limited",
            status: 429,
            params: { retryAfterSeconds: 42 },
        })

        expect(formatGraphqlError(errors, formatted, new Error("limited")).extensions).toEqual({
            code: "HTTP_SECURITY_RATE_LIMITED",
            kind: "rate-limited",
            params: { retryAfterSeconds: 42 },
        })
    })
})
