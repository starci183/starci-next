import { Test } from "@nestjs/testing"

import {
    textOf,
    kindOf,
    trackOf,
    repoUrlOf,
    locationOf,
    endpointOf,
    sampleBodyOf,
    explanationOf,
    excerptOf,
    hasSecret,
} from "./project-input.policy"

const POLICY: unique symbol = Symbol("project.project-input-policy")
const policies = {
    textOf,
    kindOf,
    trackOf,
    repoUrlOf,
    locationOf,
    endpointOf,
    sampleBodyOf,
    explanationOf,
    excerptOf,
    hasSecret,
}

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("textOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("trims and keeps a text within its bounds", () => {
        expect(subject.textOf("  Booking  ", "name", 20)).toBe("Booking")
    })

    it("refuses an empty text, a long one and a control character with the field named", () => {
        expect(() => subject.textOf("   ", "name", 20)).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.textOf("x".repeat(21), "name", 20)).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.textOf("a\u0000b", "name", 20)).toThrow("PROJECT_INPUT_INVALID")
    })
})

describe("kindOf and trackOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("accepts the two kinds only", () => {
        expect(subject.kindOf("app")).toBe("app")
        expect(subject.kindOf("agent")).toBe("agent")
        expect(() => subject.kindOf("game")).toThrow("PROJECT_INPUT_INVALID")
    })

    it("has no track for an app, and only a known tool for an agent", () => {
        expect(subject.trackOf(null, "app")).toBeNull()
        expect(subject.trackOf("claude", "agent")).toBe("claude")
        expect(subject.trackOf("hermes", "agent")).toBe("hermes")
        expect(() => subject.trackOf("claude", "app")).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.trackOf("gpt", "agent")).toThrow("PROJECT_INPUT_INVALID")
    })
})

describe("repoUrlOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("keeps an https address and clears an empty one", () => {
        expect(subject.repoUrlOf("https://github.com/a/b")).toBe("https://github.com/a/b")
        expect(subject.repoUrlOf(null)).toBeNull()
        expect(subject.repoUrlOf("  ")).toBeNull()
    })

    it("refuses other schemes, credentials and text that is not an address", () => {
        expect(() => subject.repoUrlOf("http://github.com/a/b")).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.repoUrlOf("https://user:pw@github.com/a/b")).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.repoUrlOf("https://user@github.com/a/b")).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.repoUrlOf("not a url")).toThrow("PROJECT_INPUT_INVALID")
    })
})

describe("locationOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("accepts a relative path with or without a symbol", () => {
        expect(subject.locationOf("internal/booking/repo.go")).toBe("internal/booking/repo.go")
        expect(subject.locationOf(" internal/booking/repo.go#Reserve ")).toBe("internal/booking/repo.go#Reserve")
    })

    it.each([
        "",
        "/etc/passwd",
        "~/code/a.go",
        "C:/code/a.go",
        "a\\b.go",
        "../secret.go",
        "a/../b.go",
        "a//b.go",
        "src/",
        ".env",
        "config/.env.production",
        "keys/id_rsa",
        "certs/server.pem",
        "certs/server.key",
        "secrets.yaml",
        "src/a.go#",
        "src/a.go#x#y",
        `src/a.go#${"s".repeat(81)}`,
        `${"p".repeat(201)}.go`,
    ])("refuses %j as a location", (location) => {
        expect(() => subject.locationOf(location)).toThrow("PROJECT_LOCATION_INVALID")
    })
})

describe("endpointOf and sampleBodyOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("accepts METHOD /path and refuses anything else", () => {
        expect(subject.endpointOf("POST /bookings")).toBe("POST /bookings")
        expect(subject.endpointOf(" GET /items/{id}?x=1 ")).toBe("GET /items/{id}?x=1")
        expect(() => subject.endpointOf("FETCH /x")).toThrow("PROJECT_ENDPOINT_INVALID")
        expect(() => subject.endpointOf("GET x")).toThrow("PROJECT_ENDPOINT_INVALID")
        expect(() => subject.endpointOf(`GET /${"a".repeat(200)}`)).toThrow("PROJECT_ENDPOINT_INVALID")
    })

    it("accepts small JSON and refuses text that is not JSON or is too large", () => {
        expect(subject.sampleBodyOf(' {"a":1} ')).toBe('{"a":1}')
        expect(() => subject.sampleBodyOf("{a")).toThrow("PROJECT_ENDPOINT_INVALID")
        expect(() => subject.sampleBodyOf(JSON.stringify({ a: "x".repeat(2000) }))).toThrow("PROJECT_ENDPOINT_INVALID")
    })
})

describe("explanationOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const TWO = "The cache keeps the result of the first read. Later reads come from the cache until it expires."

    it("accepts two sentences within the limit", () => {
        expect(subject.explanationOf(`  ${TWO}  `)).toBe(TWO)
    })

    it("refuses one sentence, a text that is too short and one that is too long", () => {
        const longOne = "Only one sentence but long enough to pass the minimum length of an explanation"

        expect(() => subject.explanationOf(longOne)).toThrow("PROJECT_EXPLANATION_INVALID")
        expect(() => subject.explanationOf("Too. Short.")).toThrow("PROJECT_EXPLANATION_INVALID")
        expect(() => subject.explanationOf(`${TWO} ${"More. ".repeat(100)}`)).toThrow("PROJECT_EXPLANATION_INVALID")
    })
})

describe("excerptOf and hasSecret", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("accepts code and refuses an empty or oversized excerpt", () => {
        expect(subject.excerptOf("  func Reserve() {}  ")).toBe("func Reserve() {}")
        expect(() => subject.excerptOf("   ")).toThrow("PROJECT_INPUT_INVALID")
        expect(() => subject.excerptOf("x".repeat(12_001))).toThrow("PROJECT_INPUT_INVALID")
    })

    it.each([
        ["-----BEGIN RSA", "PRIVATE KEY-----"].join(" "),
        `key ${"AKIA"}${"ABCDEFGHIJKLMNOP"} here`,
        `token ghp_${"a".repeat(36)}`,
        `OPENAI sk-${"a".repeat(30)}`,
        `slack xoxb-${"1".repeat(12)}`,
        `google AIza${"a".repeat(35)}`,
        ["jwt eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiIxMjM0NTY3ODkwIn0", "abcdefghijklmn"].join("."),
        'password = "hunter2hunter2"',
        "API_KEY: 'abcdef123456'",
    ])("recognises %j as a secret and refuses the excerpt", (text) => {
        expect(subject.hasSecret(text)).toBe(true)
        expect(() => subject.excerptOf(`func f() { ${text} }`)).toThrow("PROJECT_EXCERPT_SECRET")
    })

    it("lets a read of an environment variable through", () => {
        expect(subject.hasSecret('apiKey := os.Getenv("API_KEY")')).toBe(false)
    })
})
