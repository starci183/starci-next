import {
    defineHttpFake,
    type FakeClient,
    type FakeDefinition,
    type FakeHttpReply,
    type FakeHttpRequest,
    type HttpFakeContext,
} from "@starci/test-world/fakes"

/** The markers a spec puts in the source code to steer the verdict the fake answers; plain sources are accepted. */
export const JUDGE0_FAKE_MARKERS = {
    /** Every test is a compile error. */
    compileError: "FAKE_CE",
    /** Every test exceeds the time limit. */
    timeLimit: "FAKE_TLE",
    /** Tests whose input holds the hidden-test secret are a wrong answer, the others are accepted. */
    wrongAnswer: "FAKE_WA",
    /** The batch is read as still judging twice before it is judged. */
    slow: "FAKE_SLOW",
} as const

/** The text the hidden tests of the practice builder hold in their input, so a wrong answer hits a hidden test only. */
const HIDDEN_INPUT_MARK = "HIDDEN-ONLY-TEXT"

/** The submissions the fake accepted, by token. */
interface Judge0FakeState {
    next: number
    readonly submissions: Map<string, StoredSubmission>
}

interface StoredSubmission {
    readonly source: string
    readonly stdin: string
    readonly expectedOutput: string
    reads: number
}

type Judge0FakeContext = HttpFakeContext<Judge0FakeState, undefined>

const decode = (value: unknown): string =>
    typeof value === "string" ? Buffer.from(value, "base64").toString("utf8") : ""

const encode = (value: string): string => Buffer.from(value, "utf8").toString("base64")

const isJson = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

const authorized = (request: FakeHttpRequest, context: Judge0FakeContext): boolean =>
    request.headers["x-auth-token"] === context.secret("judge0-auth-token")

const refusal = (status: number): FakeHttpReply => ({ status, body: { error: "refused" } })

const create = (request: FakeHttpRequest, context: Judge0FakeContext): FakeHttpReply => {
    if (!authorized(request, context)) return refusal(401)
    const body = request.json()
    const list = isJson(body) ? body["submissions"] : undefined
    if (!Array.isArray(list)) return refusal(422)
    const tokens = list.map((entry: unknown) => {
        const data = isJson(entry) ? entry : {}
        context.state.next += 1
        const token = `fake-token-${context.state.next}`
        context.state.submissions.set(token, {
            source: decode(data["source_code"]),
            stdin: decode(data["stdin"]),
            expectedOutput: decode(data["expected_output"]),
            reads: 0,
        })
        return { token }
    })
    return { status: 201, body: tokens }
}

interface Judged {
    readonly id: number
    readonly description: string
    readonly stdout: string
    readonly compileOutput: string
}

const judged = (stored: StoredSubmission): Judged => {
    if (stored.source.includes(JUDGE0_FAKE_MARKERS.compileError))
        return { id: 6, description: "Compilation Error", stdout: "", compileOutput: "error: expected ';' before '}'" }
    if (stored.source.includes(JUDGE0_FAKE_MARKERS.timeLimit))
        return { id: 5, description: "Time Limit Exceeded", stdout: "", compileOutput: "" }
    if (stored.source.includes(JUDGE0_FAKE_MARKERS.wrongAnswer) && stored.stdin.includes(HIDDEN_INPUT_MARK))
        return { id: 4, description: "Wrong Answer", stdout: "0\n", compileOutput: "" }
    return { id: 3, description: "Accepted", stdout: stored.expectedOutput, compileOutput: "" }
}

const entryOf = (token: string, stored: StoredSubmission): Record<string, unknown> => {
    stored.reads += 1
    if (stored.source.includes(JUDGE0_FAKE_MARKERS.slow) && stored.reads <= 2)
        return { token, status: { id: stored.reads === 1 ? 1 : 2, description: "Processing" } }
    const result = judged(stored)
    const ran = result.id !== 6
    return {
        token,
        status: { id: result.id, description: result.description },
        stdout: result.stdout === "" ? null : encode(result.stdout),
        stderr: null,
        compile_output: result.compileOutput === "" ? null : encode(result.compileOutput),
        time: ran ? "0.012" : null,
        memory: ran ? 3000 : null,
    }
}

const read = (request: FakeHttpRequest, context: Judge0FakeContext): FakeHttpReply => {
    if (!authorized(request, context)) return refusal(401)
    const tokens = (request.query.get("tokens") ?? "").split(",").filter((token) => token !== "")
    const found = tokens.map((token) => [token, context.state.submissions.get(token)] as const)
    if (found.some(([, stored]) => stored === undefined)) return refusal(404)
    return {
        body: {
            submissions: found.flatMap(([token, stored]) => (stored === undefined ? [] : [entryOf(token, stored)])),
        },
    }
}

/**
 * The Judge0 fake: the batch create and read endpoints of a self-hosted Judge0 behind the `X-Auth-Token` header. It judges by
 * markers in the source code (see `JUDGE0_FAKE_MARKERS`); a plain source is accepted with the expected output. Steered with
 * `failNext` for an outage or a refused token.
 */
export const judge0Fake: (options?: undefined) => FakeDefinition<FakeClient> = defineHttpFake<
    FakeClient,
    undefined,
    Judge0FakeState
>({
    state: () => ({ next: 0, submissions: new Map() }),
    routes: [
        { method: "POST", path: "/submissions/batch", handle: create },
        { method: "GET", path: "/submissions/batch", handle: read },
    ],
    values: (context) => ({ authToken: context.secret("judge0-auth-token") }),
})
