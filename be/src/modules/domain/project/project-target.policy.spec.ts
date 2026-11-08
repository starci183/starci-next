import { Test } from "@nestjs/testing"

import { publicTargetOf } from "./project-target.policy"

const POLICY: unique symbol = Symbol("project.project-target-policy")
const policies = { publicTargetOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("publicTargetOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("keeps the origin and the path prefix and drops the query, the fragment and a trailing slash", () => {
        expect(subject.publicTargetOf("https://app.example.com/api/?x=1#top")).toBe("https://app.example.com/api")
        expect(subject.publicTargetOf(" http://app.example.com ")).toBe("http://app.example.com")
        expect(subject.publicTargetOf("https://app.example.com:8443")).toBe("https://app.example.com:8443")
        expect(subject.publicTargetOf("http://8.8.8.8:8080/x")).toBe("http://8.8.8.8:8080/x")
        expect(subject.publicTargetOf("http://[2606:4700:4700::1111]/")).toBe("http://[2606:4700:4700::1111]")
    })

    it.each([
        "",
        "   ",
        "not a url",
        "ftp://app.example.com",
        "file:///etc/passwd",
        "javascript:alert(1)",
        "https://user:pw@app.example.com",
        "https://user@app.example.com",
        "http://localhost",
        "http://localhost:3000",
        "http://app.localhost",
        "http://printer.local",
        "http://db.internal",
        "http://host.lan",
        "http://nas.home",
        "http://wiki.corp",
        "http://x.intranet",
        "http://intranet",
        "http://app.example.com.",
        "http://127.0.0.1",
        "http://0x7f.1",
        "http://2130706433",
        "http://10.0.0.5",
        "http://169.254.169.254/latest/meta-data",
        "http://192.168.0.1",
        "http://[::1]",
        "http://[::ffff:127.0.0.1]",
        "http://[fe80::1]",
        "https://app.example.com:22",
        "https://app.example.com:5432",
        `https://${"a".repeat(300)}.example.com`,
    ])("refuses %j as a target", (target) => {
        expect(() => subject.publicTargetOf(target)).toThrow("PROJECT_TARGET_REFUSED")
    })
})
