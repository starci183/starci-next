import type { HarnessGuideRowView, HarnessGuideView, HarnessLocale, HarnessTool } from "@/modules/types"
import { fenced, pick } from "./words"

/** One guide before its language is chosen: the tool, the slug, the minutes and a builder of its words. */
type GuideSource = {
    readonly slug: string
    readonly tool: HarnessTool
    readonly minutes: number
    readonly words: (l: HarnessLocale) => {
        readonly title: string
        readonly summary: string
        readonly markdown: string
    }
}

/** The guides of part 2, in the order a learner reads them. */
const SOURCES: ReadonlyArray<GuideSource> = [
    {
        slug: "claude-install",
        tool: "claude",
        minutes: 6,
        words: (l) => ({
            title: pick(l, "Cài Claude Code", "Install Claude Code"),
            summary: pick(
                l,
                "Cài, đăng nhập và chạy lần đầu trên một repo.",
                "Install, sign in and run it once on a repo.",
            ),
            markdown: `${pick(l, "## Cài đặt", "## Install")}\n\n${pick(l, "Cần Node 20 trở lên. Cài một lần cho cả máy.", "You need Node 20 or newer. Install once for the whole machine.")}\n\n${fenced("bash", "npm install -g @anthropic-ai/claude-code\nclaude --version")}\n${pick(l, "## Đăng nhập", "## Sign in")}\n\n${pick(l, "Chạy `claude` trong thư mục repo và làm theo trình duyệt. Key và token nằm trên máy bạn.", "Run `claude` in the repo folder and follow the browser. Keys and tokens stay on your machine.")}\n\n${fenced("bash", "cd my-repo\nclaude")}\n${pick(l, "## Kiểm tra", "## Check")}\n\n${pick(l, "Lệnh sau đọc cấu hình trên máy bạn và báo từng điều kiện.", "The next command reads the setup on your machine and reports each condition.")}\n\n${fenced("bash", "npx @starci/next harness doctor --tool claude")}`,
        }),
    },
    {
        slug: "claude-md",
        tool: "claude",
        minutes: 9,
        words: (l) => ({
            title: pick(l, "CLAUDE.md đầu tiên", "Your first CLAUDE.md"),
            summary: pick(
                l,
                "Lời dặn dài hạn cho agent, ngắn và kiểm được.",
                "Standing instructions for the agent, short and checkable.",
            ),
            markdown: `${pick(l, "## CLAUDE.md để làm gì", "## What CLAUDE.md is for")}\n\n${pick(l, "Claude Code đọc `CLAUDE.md` ở đầu mỗi phiên. Nó là lời dặn, không phải luật cứng: agent vẫn có thể bỏ qua khi bị ép.", "Claude Code reads `CLAUDE.md` at the start of each session. It is advice, not a hard rule: the agent can still skip it under pressure.")}\n\n${pick(l, "## Viết ngắn và kiểm được", "## Keep it short and checkable")}\n\n${pick(l, "Mỗi dòng nên là một điều có thể kiểm bằng máy.", "Each line should be something a machine can check.")}\n\n${fenced("md", "# Rules\n- Run `npm test` before every commit.\n- Never edit files under `tests/`.\n- Never pass `--no-verify` to git.")}\n${pick(l, "## Chuyển lời dặn thành luật cứng", "## Turn advice into a hard rule")}\n\n${pick(l, "Dòng nào quan trọng thì chuyển sang hook ở bài sau.", "Move the lines that matter into a hook in the next guide.")}`,
        }),
    },
    {
        slug: "claude-hooks",
        tool: "claude",
        minutes: 12,
        words: (l) => ({
            title: pick(l, "Hook: luật cứng cho Claude Code", "Hooks: hard rules for Claude Code"),
            summary: pick(
                l,
                "Chặn agent commit khi test đỏ, bằng máy.",
                "Stop the agent from committing on red tests, by machine.",
            ),
            markdown: `${pick(l, "## Chặn commit không qua hook", "## Block commits that skip hooks")}\n\n${pick(l, "Claude Code chạy lệnh của bạn trước mỗi tool call và hủy tool call nếu lệnh thoát với mã 2.", "Claude Code runs your command before each tool call and cancels the call when the command exits with code 2.")}\n\n${fenced("json", '{ "hooks": { "PreToolUse": [{ "matcher": "Bash",\n  "hooks": [{ "type": "command",\n    "command": "node .claude/hooks/no-verify.mjs" }] }] } }')}\n${pick(l, "## Viết hook", "## Write the hook")}\n\n${fenced("js", 'const input = JSON.parse(await readStdin())\nif (/--no-verify/.test(input.tool_input.command)) {\n  console.error("Blocked: hooks must not be skipped")\n  process.exit(2)\n}')}\n${pick(l, "## Thử hook", "## Try the hook")}\n\n${pick(l, "Bảng thử thách trong phần Xài cho agent một cái bẫy để xem nó có đi đường tắt không.", "The trial panel in Use gives the agent a trap to see whether it takes a shortcut.")}\n\n${fenced("bash", "npx @starci/next harness trial no-verify --tool claude")}`,
        }),
    },
    {
        slug: "codex-install",
        tool: "codex",
        minutes: 6,
        words: (l) => ({
            title: pick(l, "Cài Codex", "Install Codex"),
            summary: pick(
                l,
                "Cài, đăng nhập và chạy lần đầu trên một repo.",
                "Install, sign in and run it once on a repo.",
            ),
            markdown: `${pick(l, "## Cài đặt", "## Install")}\n\n${fenced("bash", "npm install -g @openai/codex\ncodex --version")}\n${pick(l, "## Đăng nhập", "## Sign in")}\n\n${pick(l, "Chạy `codex` trong thư mục repo và đăng nhập. Cấu hình nằm ở `~/.codex/config.toml` trên máy bạn.", "Run `codex` in the repo folder and sign in. The configuration lives in `~/.codex/config.toml` on your machine.")}\n\n${fenced("bash", "cd my-repo\ncodex")}\n${pick(l, "## Kiểm tra", "## Check")}\n\n${fenced("bash", "npx @starci/next harness doctor --tool codex")}`,
        }),
    },
    {
        slug: "agents-md",
        tool: "codex",
        minutes: 9,
        words: (l) => ({
            title: pick(l, "AGENTS.md đầu tiên", "Your first AGENTS.md"),
            summary: pick(
                l,
                "Lời dặn dài hạn cho Codex, cùng nguyên tắc với CLAUDE.md.",
                "Standing instructions for Codex, the same principle as CLAUDE.md.",
            ),
            markdown: `${pick(l, "## AGENTS.md để làm gì", "## What AGENTS.md is for")}\n\n${pick(l, "Codex đọc `AGENTS.md` từ thư mục gốc xuống thư mục đang làm việc. File gần hơn thắng.", "Codex reads `AGENTS.md` from the root down to the working folder. The closer file wins.")}\n\n${fenced("md", "# Rules\n- Run `npm test` before every commit.\n- Never edit files under `tests/`.")}\n${pick(l, "## Giới hạn của lời dặn", "## The limit of advice")}\n\n${pick(l, "Lời dặn không chặn được gì. Luật cứng nằm ở sandbox, hook của git và CI.", "Advice blocks nothing. Hard rules live in the sandbox, git hooks and CI.")}`,
        }),
    },
    {
        slug: "codex-hard-rules",
        tool: "codex",
        minutes: 12,
        words: (l) => ({
            title: pick(l, "Sandbox, duyệt lệnh và hook git", "Sandbox, approvals and git hooks"),
            summary: pick(
                l,
                "Luật cứng cho Codex: config.toml, hook git và CI.",
                "Hard rules for Codex: config.toml, git hooks and CI.",
            ),
            markdown: `${pick(l, "## Sandbox và duyệt lệnh", "## Sandbox and approvals")}\n\n${fenced("toml", 'approval_policy = "on-request"\nsandbox_mode = "workspace-write"')}\n${pick(l, "## Hook git là luật cứng", "## A git hook is a hard rule")}\n\n${pick(l, "Codex chạy `git commit` như mọi người, nên hook `pre-commit` chặn được nó.", "Codex runs `git commit` like anyone, so a `pre-commit` hook stops it.")}\n\n${fenced("bash", "#!/bin/sh\nnpm test || exit 1")}\n${pick(l, "## Chạy không giao diện", "## Run it headless")}\n\n${fenced("bash", 'codex exec "fix the failing test"')}\n${pick(l, "## Thử bằng bẫy", "## Try it with a trap")}\n\n${fenced("bash", "npx @starci/next harness trial no-verify --tool codex")}`,
        }),
    },
]

/** The rows of the guides of one tool, in reading order. */
export const guideRowsOf = (locale: HarnessLocale): ReadonlyArray<HarnessGuideRowView> =>
    SOURCES.map((source) => {
        const { title, summary } = source.words(locale)
        return { slug: source.slug, tool: source.tool, title, summary, minutes: source.minutes }
    })

/** One guide with its markdown, or undefined when none carries the slug. */
export const guideOf = (slug: string, locale: HarnessLocale): HarnessGuideView | undefined => {
    const source = SOURCES.find((each) => each.slug === slug)
    if (source === undefined) return undefined
    const { title, summary, markdown } = source.words(locale)
    return { slug, tool: source.tool, title, summary, minutes: source.minutes, markdown }
}
