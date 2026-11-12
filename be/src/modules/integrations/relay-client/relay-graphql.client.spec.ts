import { Test } from "@nestjs/testing"
import type { Fetcher } from "./relay-client.contracts"
import { MANIFEST_QUERY, relayGraphql, uploadMutationOf } from "./relay-graphql.client"

const CLIENT: unique symbol = Symbol("relay-client.graphql-client")
const client = { relayGraphql, uploadMutationOf }

const build = async (): Promise<typeof client> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: CLIENT, useFactory: () => client }],
    }).compile()
    return moduleRef.get<typeof client>(CLIENT)
}

const answering =
    (status: number, text: string): Fetcher =>
    () =>
        Promise.resolve({ status, text })

const run = async (fetcher: Fetcher) =>
    (await build()).relayGraphql(fetcher, "https://app.test", "tok", MANIFEST_QUERY, { a: 1 })

describe("relayGraphql", () => {
    it("posts the operation with the device token and answers the data", async () => {
        const fetcher = jest.fn<ReturnType<Fetcher>, Parameters<Fetcher>>(() =>
            Promise.resolve({ status: 200, text: JSON.stringify({ data: { relayManifest: null } }) }),
        )

        await expect(run(fetcher)).resolves.toEqual({ kind: "data", data: { relayManifest: null } })
        expect(fetcher).toHaveBeenCalledWith("https://app.test/graphql", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                accept: "application/json",
                authorization: "Bearer tok",
            },
            body: JSON.stringify({ query: MANIFEST_QUERY, variables: { a: 1 } }),
        })
    })

    it("answers the stable code of the first error", async () => {
        const body = { errors: [{ extensions: { code: "RELAY_X" } }] }

        await expect(run(answering(200, JSON.stringify(body)))).resolves.toEqual({
            kind: "refused",
            code: "RELAY_X",
            status: 200,
        })
    })

    it.each([
        ["an error that is not an object", { errors: ["x"] }],
        ["an error without extensions", { errors: [{ message: "m" }] }],
        ["extensions without a code text", { errors: [{ extensions: { code: 5 } }] }],
    ])("answers unavailable for %s", async (_name, body) => {
        await expect(run(answering(500, JSON.stringify(body)))).resolves.toEqual({
            kind: "refused",
            code: "RELAY_UNAVAILABLE",
            status: 500,
        })
    })

    it.each([
        ["a body that is not JSON", "<html>"],
        ["a body that is not an object", "[]"],
        ["no data", "{}"],
        ["data that is not an object", JSON.stringify({ data: 1 })],
    ])("answers unavailable for %s", async (_name, text) => {
        await expect(run(answering(502, text))).resolves.toMatchObject({ kind: "refused", status: 502 })
    })

    it("words the mutation of an upload by its input type", async () => {
        const { uploadMutationOf: wording } = await build()

        expect(wording("relayLog")).toContain("RelayLogInput")
    })
})
