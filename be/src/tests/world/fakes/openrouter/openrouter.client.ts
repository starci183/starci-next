import { defineHttpFake, type FakeBridge, type FakeClient, type FakeDefinition } from "@starci/test-world/fakes"

/** What a spec drives on the OpenRouter fake besides the base handle: the text the model answers next. */
export interface OpenrouterFakeClient extends FakeClient {
    /** Makes the model answer this text to every chat completion until the next reset. */
    reply(text: string): Promise<void>
}

/** The text of the model before a spec scripts it: a grade that holds no criteria. */
const EMPTY_GRADE = '{"criteria":[]}'

/** The text the fake answers. */
interface OpenrouterFakeState {
    text: string
}

/** The fields of a chat-completion answer, in the shape OpenRouter returns them. */
const completionOf = (model: string, text: string): Record<string, unknown> => ({
    id: "gen-fake-1",
    object: "chat.completion",
    created: 1_790_000_000,
    model,
    choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
    usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
})

const modelOf = (body: unknown): string =>
    typeof body === "object" && body !== null && "model" in body && typeof body.model === "string"
        ? body.model
        : "unknown"

/** The OpenRouter fake: the chat-completions endpoint answering the text a spec scripted, steered with `failNext` for an outage or a refused key. */
export const openrouterFake: (options?: undefined) => FakeDefinition<OpenrouterFakeClient> = defineHttpFake<
    OpenrouterFakeClient,
    undefined,
    OpenrouterFakeState
>({
    state: () => ({ text: EMPTY_GRADE }),
    routes: [
        {
            method: "POST",
            path: "/chat/completions",
            handle: (request, context) => ({ body: completionOf(modelOf(request.json()), context.state.text) }),
        },
    ],
    controlActions: {
        reply: (body, context) => {
            context.state.text = typeof body === "object" && body !== null && "text" in body ? String(body.text) : ""
        },
    },
    client: (bridge: FakeBridge, base: FakeClient): OpenrouterFakeClient => ({
        ...base,
        reply: (text) => bridge.call<void>("reply", { text }),
    }),
})
