import { inputErrors, inputTypeOf, operationErrors } from "./core-schema.testing"
import {
    CLAIM_PAIR_CODE_MUTATION,
    MANIFEST_QUERY,
    REGISTER_DEVICE_KEY_MUTATION,
    uploadMutationOf,
} from "./relay-graphql.client"
import type { UploadMutation } from "./relay-client.contracts"

const UPLOADS: ReadonlyArray<UploadMutation> = [
    "relayCheckStarted",
    "relayCheckResult",
    "relayLog",
    "relayManifestAck",
    "relayHarnessResult",
    "relayLabBoot",
    "relayLabTests",
    "relayLabFiles",
    "relayLabGrade",
]

describe("the learner CLI's GraphQL against the core's schema snapshot", () => {
    const OPERATIONS: ReadonlyArray<readonly [string, string]> = [
        ["the pair code claim", CLAIM_PAIR_CODE_MUTATION],
        ["the device key registration", REGISTER_DEVICE_KEY_MUTATION],
        ["the manifest query", MANIFEST_QUERY],
        ...UPLOADS.map((mutation): readonly [string, string] => [`the ${mutation} upload`, uploadMutationOf(mutation)]),
    ]

    it.each(OPERATIONS)("accepts %s as a valid operation, with the input type the schema names", (_name, query) => {
        expect(operationErrors(query)).toEqual([])
        expect(inputTypeOf(query)).not.toBeNull()
    })

    it("takes the pair code claim and the key registration as one `input`, the way every door of the core does", () => {
        expect(
            inputErrors(CLAIM_PAIR_CODE_MUTATION, { code: "123456", deviceName: "laptop", platform: "linux" }),
        ).toEqual([])
        expect(inputErrors(REGISTER_DEVICE_KEY_MUTATION, { publicKey: "MCowBQYDK2VwAyEA" })).toEqual([])
        expect(inputErrors(CLAIM_PAIR_CODE_MUTATION, { code: "123456", deviceName: "laptop" })).not.toEqual([])
        expect(inputErrors(REGISTER_DEVICE_KEY_MUTATION, { key: "x" })).not.toEqual([])
    })

    it("refuses an upload that lacks a required field or carries one the input does not have, such as a lab.files upload without its runId", () => {
        const query = uploadMutationOf("relayLabFiles")
        const whole = { eventId: "e", taskId: "course:a/b", runId: "r", commit: "c".repeat(40), files: [] }

        expect(inputErrors(query, whole)).toEqual([])
        expect(inputErrors(query, { ...whole, runId: undefined })).not.toEqual([])
        expect(inputErrors(query, { ...whole, extra: 1 })).not.toEqual([])
    })

    it("refuses an operation the schema does not know, which is how this check would have caught the old claim and key calls", () => {
        expect(
            operationErrors(
                "mutation ($code: String!, $deviceName: String!, $platform: String!) { claimRelayPairCode(code: $code, deviceName: $deviceName, platform: $platform) { deviceToken } }",
            ),
        ).not.toEqual([])
        expect(
            operationErrors("mutation ($publicKey: String!) { registerRelayDeviceKey(publicKey: $publicKey) }"),
        ).not.toEqual([])
    })
})
