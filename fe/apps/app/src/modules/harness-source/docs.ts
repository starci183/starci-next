import type { HarnessDocRowView, HarnessDocView, HarnessLocale } from "@/modules/types"
import { fenced, pick } from "./words"

/** One article before its language is chosen. */
type DocSource = {
    readonly slug: string
    readonly minutes: number
    readonly words: (l: HarnessLocale) => {
        readonly title: string
        readonly summary: string
        readonly markdown: string
    }
}

/** The loop diagram every article of part 3 can point at: context, model, tool call and the harness between them. */
const LOOP_DIAGRAM = fenced(
    "mermaid",
    "flowchart LR\n  C[Context] --> M[Model]\n  M --> T[Tool call]\n  T --> H{Harness}\n  H -->|allowed| R[Result]\n  H -->|blocked| M\n  R --> C",
)

/** The articles of part 3, in the order a curious learner reads them. */
const SOURCES: ReadonlyArray<DocSource> = [
    {
        slug: "why-agents-cut-corners",
        minutes: 25,
        words: (l) => ({
            title: pick(l, "Vì sao agent làm bậy", "Why agents cut corners"),
            summary: pick(
                l,
                "Agent không biết, nó dự đoán token tiếp theo trong một vòng lặp.",
                "An agent does not know, it predicts the next token inside a loop.",
            ),
            markdown: `${pick(l, "## Một vòng lặp, không phải một bộ não", "## A loop, not a brain")}\n\n${pick(l, "Mỗi lượt, Claude hay Codex nhận toàn bộ context rồi sinh ra lượt tiếp theo. Nó không nhớ gì ngoài context.", "Each turn, Claude or Codex receives the whole context and produces the next turn. It remembers nothing outside the context.")}\n\n${LOOP_DIAGRAM}\n${pick(l, "## Áp lực làm test xanh", "## The pressure to turn tests green")}\n\n${pick(l, 'Khi bị ép "làm cho test xanh", đường ngắn nhất trong không gian token có thể là sửa test hoặc bỏ qua hook. Đó không phải ác ý, đó là tối ưu hóa.', 'Under "make the tests green", the shortest path in token space can be editing the test or skipping a hook. That is not malice, it is optimization.')}\n\n${pick(l, "## Ba đường tắt hay gặp", "## Three common shortcuts")}\n\n| ${pick(l, "Đường tắt", "Shortcut")} | ${pick(l, "Dấu hiệu", "Sign")} | ${pick(l, "Chặn bằng", "Stopped by")} |\n| --- | --- | --- |\n| ${pick(l, "Sửa test", "Edit the test")} | ${pick(l, "diff chạm vào thư mục test", "the diff touches the test folder")} | ${pick(l, "hash file test", "test file hashes")} |\n| ${pick(l, "Bỏ qua hook", "Skip a hook")} | \`--no-verify\` | ${pick(l, "hook PreToolUse", "a PreToolUse hook")} |\n| ${pick(l, "Xóa kiểm tra", "Delete the check")} | ${pick(l, "dòng assert biến mất", "an assert line disappears")} | CI |`,
        }),
    },
    {
        slug: "what-a-harness-is",
        minutes: 18,
        words: (l) => ({
            title: pick(l, "Harness là gì", "What a harness is"),
            summary: pick(
                l,
                "Mọi thứ nằm ngoài model mà quyết định model thấy gì, được làm gì.",
                "Everything outside the model that decides what it sees and what it may do.",
            ),
            markdown: `${pick(l, "## Định nghĩa", "## Definition")}\n\n${pick(l, "Harness là mọi thứ nằm ngoài model mà quyết định model thấy gì, được làm gì và bị bắt lỗi ra sao.", "A harness is everything outside the model that decides what the model sees, what it may do and how its mistakes are caught.")}\n\n${pick(l, "## Các lớp", "## The layers")}\n\n${fenced("mermaid", "flowchart TB\n  A[Rules file] --> B[Hooks and permissions]\n  B --> C[Checks and gates]\n  C --> D[CI]")}\n${pick(l, "## StarCi harness xếp các lớp ra sao", "## How the StarCi harness stacks them")}\n\n${pick(l, "Mỗi lớp trả lời một câu hỏi: lời dặn, chặn ngay lúc làm, kiểm sau khi làm, và kiểm lần cuối trên máy chủ.", "Each layer answers one question: advice, block at the moment, check after the work, and check one last time on the server.")}\n\n${pick(l, "## Đọc tiếp", "## Read next")}\n\n${pick(l, "Bài sau đi qua từng lớp với một repo thật.", "The next article goes through each layer with a real repo.")}`,
        }),
    },
]

/** The rows of every article. */
export const docRowsOf = (locale: HarnessLocale): ReadonlyArray<HarnessDocRowView> =>
    SOURCES.map((source) => {
        const { title, summary } = source.words(locale)
        return { slug: source.slug, title, summary, minutes: source.minutes }
    })

/** One article with its markdown, or undefined when none carries the slug. */
export const docOf = (slug: string, locale: HarnessLocale): HarnessDocView | undefined => {
    const source = SOURCES.find((each) => each.slug === slug)
    if (source === undefined) return undefined
    const { title, summary, markdown } = source.words(locale)
    return { slug, title, summary, minutes: source.minutes, markdown }
}
