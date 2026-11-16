import { lessonSourceTreeOf } from "./lesson-source-tree.policy"

const COMMIT = "abc1234def5678abc1234def5678abc1234def56"

const content = {
    sourceCode: [
        { path: "src/b.ts", content: "b" },
        { path: "src/a.ts", content: "a" },
        { path: "bad", content: 5 },
    ],
    locales: {
        vi: {
            essential: {
                invariants: [{ id: "one-effect", text: "A transfer applies once" }, { id: "x" }],
                codeWalk: [{ invariant: "one-effect", file: "src/a.ts", line: 3, snippet: "SNIPPET" }],
                scenarios: [
                    {
                        id: "double-spend",
                        title: "T",
                        fault: "F",
                        invariant: "one-effect",
                        expected: "EXPECTED",
                        hint: "HINT",
                        guards: [{ name: "idempotency", env: "IDEMPOTENCY" }],
                    },
                    { id: "broken" },
                ],
                challenges: [
                    {
                        id: "c",
                        rubric: [{ criterion: "RUBRIC" }],
                        hidden: [{ id: "h", files: [{ content: "HIDDEN" }] }],
                    },
                ],
            },
        },
    },
}

describe("lessonSourceTreeOf", () => {
    it("reads the source files in path order at the content commit, with the public scenarios and where each invariant lives", () => {
        expect(lessonSourceTreeOf(COMMIT, content)).toEqual({
            commit: COMMIT,
            files: [
                { path: "src/a.ts", text: "a" },
                { path: "src/b.ts", text: "b" },
            ],
            scenarios: [
                { id: "double-spend", title: "T", fault: "F", invariant: "one-effect", guards: ["idempotency"] },
            ],
            invariants: [{ id: "one-effect", text: "A transfer applies once", where: "src/a.ts:3" }],
        })
    })

    it("copies nothing of the expected output, the hint, the code walk snippet, a challenge, its rubric or its hidden files", () => {
        const text = JSON.stringify(lessonSourceTreeOf(COMMIT, content))
        for (const secret of ["EXPECTED", "HINT", "SNIPPET", "RUBRIC", "HIDDEN"]) expect(text).not.toContain(secret)
    })

    it("is null for a version that is not a commit or ships no source", () => {
        expect(lessonSourceTreeOf("v1", content)).toBeNull()
        expect(lessonSourceTreeOf(COMMIT, { locales: {} })).toBeNull()
        expect(lessonSourceTreeOf(COMMIT, null)).toBeNull()
    })
})
