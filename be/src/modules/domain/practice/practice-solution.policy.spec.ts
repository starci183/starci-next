import { Test } from "@nestjs/testing"
import * as subject from "./practice-solution.policy"
import type { PracticeSolutions } from "./practice.contracts"

const SUBJECT: unique symbol = Symbol("practice.practice-solution.policy")

const SOLUTIONS: PracticeSolutions = {
    cpp: "int main() {}",
    java: "class A {}",
    javascript: "const a = 1",
    python: "a = 1",
    typescript: "const a: number = 1",
}

describe("practice solution policy", () => {
    let solutionMarkdownOf: typeof subject.solutionMarkdownOf
    let languageNameOf: typeof subject.languageNameOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ solutionMarkdownOf, languageNameOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("writes the explanation of the locale first, then the code of each language in a fenced block", () => {
        const markdown = solutionMarkdownOf({ vi: "Giai thich", en: "Explained" }, SOLUTIONS, "en")

        expect(markdown.startsWith("Explained\n\n```cpp\nint main() {}\n```")).toBe(true)
        expect(markdown).toContain("```typescript\nconst a: number = 1\n```")
        expect(markdown).not.toContain("Giai thich")
    })

    it("answers the code alone when the author wrote no explanation in the locale", () => {
        const markdown = solutionMarkdownOf({ vi: "", en: "x" }, SOLUTIONS, "vi")

        expect(markdown.startsWith("```cpp")).toBe(true)
    })

    it("skips a language that has no code and lengthens the fence around code that holds backticks", () => {
        const markdown = solutionMarkdownOf({ vi: "", en: "" }, { ...SOLUTIONS, java: "", python: "x = '```'" }, "en")

        expect(markdown).not.toContain("```java\n")
        expect(markdown).toContain("````python\nx = '```'\n````")
    })

    it("names a language for display and leaves an unknown one as it is", () => {
        expect(languageNameOf("cpp")).toBe("C++")
        expect(languageNameOf("typescript")).toBe("TypeScript")
        expect(languageNameOf("cobol")).toBe("cobol")
    })
})
