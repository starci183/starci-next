import type {
    HarnessBuildRowView,
    HarnessBuildView,
    HarnessE2eCaseView,
    HarnessLocale,
    HarnessStageView,
} from "@/modules/types"
import { fenced, pick } from "./words"

/** One e2e case before it gets its id: the title, how it came out and why it failed. */
type CaseRow = readonly [string, HarnessE2eCaseView["outcome"], string]

/** The e2e cases of one stage given as rows. */
const casesOf = (stage: string, rows: ReadonlyArray<CaseRow>): ReadonlyArray<HarnessE2eCaseView> =>
    rows.map(([title, outcome, detail], index) => ({ id: `${stage}-c${index + 1}`, title, outcome, detail }))

/** One stage from its cases: the counts and the outcome follow the cases. */
const stageOf = (
    head: Pick<HarnessStageView, "id" | "title" | "summary" | "isLocked" | "steps">,
    cases: ReadonlyArray<HarnessE2eCaseView>,
): HarnessStageView => {
    const passed = cases.filter((each) => each.outcome === "green").length
    const hasRed = cases.some((each) => each.outcome === "red")
    const outcome = passed === cases.length ? "green" : hasRed ? "red" : "untested"
    return { ...head, passed, total: cases.length, outcome, cases }
}

/** The stages of the agent CLI build that carry steps, in the language asked. */
const agentCliOpening = (l: HarnessLocale): ReadonlyArray<HarnessStageView> => [
    stageOf(
        {
            id: "model",
            title: pick(l, "Gọi model bằng key của bạn", "Call the model with your key"),
            summary: pick(l, "Stream, thử lại khi 429, đếm token", "Stream, retry on 429, count tokens"),
            isLocked: false,
            steps: [
                {
                    id: "model-1",
                    title: pick(l, "Đặt key trong .env", "Put your key in .env"),
                    markdown: `${pick(l, "Key nằm trong `.env` trên máy bạn, StarCi không bao giờ nhận nó.", "The key lives in `.env` on your machine; StarCi never receives it.")}\n\n${fenced("bash", "cp .env.example .env\n# ANTHROPIC_API_KEY=sk-ant-...")}`,
                },
                {
                    id: "model-2",
                    title: pick(l, "Gọi model và stream", "Call the model and stream"),
                    markdown: `${pick(l, "Mở `src/agent.ts` và thay phần gọi một lần bằng vòng đọc stream.", "Open `src/agent.ts` and replace the single call with a stream reader.")}\n\n${fenced("ts", 'const stream = await client.messages.stream({ model, max_tokens: 1024, messages })\nfor await (const chunk of stream) process.stdout.write(chunk.text ?? "")')}\n${fenced("bash", "npm run e2e -- --stage model")}`,
                },
            ],
        },
        casesOf("model", [
            [pick(l, "gọi model và stream từng đoạn", "calls the model and streams chunks"), "green", ""],
            [pick(l, "thử lại khi gặp 429", "retries on a 429"), "green", ""],
            [pick(l, "đếm token vào và ra", "counts tokens in and out"), "green", ""],
        ]),
    ),
    stageOf(
        {
            id: "loop",
            title: pick(l, "Vòng lặp tool", "The tool loop"),
            summary: pick(
                l,
                "Model gọi tool, chạy, trả kết quả, lặp tới khi dừng",
                "The model calls a tool, it runs, the result returns, repeat until it stops",
            ),
            isLocked: false,
            steps: [
                {
                    id: "loop-1",
                    title: pick(l, "Khai báo tool", "Declare a tool"),
                    markdown: `${pick(l, "Mỗi tool có tên, mô tả, schema đầu vào và một hàm chạy.", "Each tool has a name, a description, an input schema and a run function.")}\n\n${fenced("ts", 'export const tools = [{ name: "read_file", description: "Read a file", input: z.object({ path: z.string() }), run }]')}`,
                },
                {
                    id: "loop-2",
                    title: pick(l, "Lặp tới khi dừng", "Loop until it stops"),
                    markdown: `${pick(l, "Có hai điều kiện dừng: model không gọi tool, hoặc hết số vòng.", "There are two stop conditions: the model calls no tool, or the turns run out.")}\n\n${fenced("ts", "for (let turn = 0; turn < maxTurns; turn += 1) {\n  const reply = await ask(messages)\n  if (reply.toolCalls.length === 0) return reply.text\n  messages.push(...(await runTools(reply.toolCalls)))\n}")}\n${fenced("bash", "npm run e2e -- --stage loop")}`,
                },
            ],
        },
        casesOf("loop", [
            [pick(l, "chạy tool rồi trả kết quả cho model", "runs a tool and feeds the result back"), "green", ""],
            [pick(l, "dừng khi model không gọi tool nữa", "stops when the model calls no more tools"), "green", ""],
            [pick(l, "dừng sau số vòng tối đa", "stops after the maximum turns"), "green", ""],
            [pick(l, "tool lỗi quay về cho model đọc", "a failing tool returns to the model"), "green", ""],
        ]),
    ),
]

/** The files stage of the agent CLI build: the one the learner is on, with a red case. */
const agentCliFiles = (l: HarnessLocale): HarnessStageView =>
    stageOf(
        {
            id: "files",
            title: pick(l, "Tool đọc ghi file an toàn", "Safe file tools"),
            summary: pick(
                l,
                "Chặn đường dẫn ngoài dự án, symlink, file quá lớn",
                "Block paths outside the project, symlinks, oversized files",
            ),
            isLocked: false,
            steps: [
                {
                    id: "files-1",
                    title: pick(l, "Chuẩn hóa đường dẫn", "Normalize the path"),
                    markdown: `${pick(l, "Mọi đường dẫn đi qua một hàm duy nhất trước khi chạm vào đĩa.", "Every path goes through one function before it touches the disk.")}\n\n${fenced("ts", 'const inside = (root: string, input: string): string => {\n  const full = path.resolve(root, input)\n  if (!full.startsWith(root + path.sep)) throw new Error("outside project")\n  return full\n}')}`,
                },
                {
                    id: "files-2",
                    title: pick(l, "Chặn symlink", "Block symlinks"),
                    markdown: `${pick(l, "Đường dẫn hợp lệ vẫn có thể là symlink trỏ ra ngoài. Phân giải thật rồi so lại.", "A valid path can still be a symlink that points outside. Resolve it for real and compare again.")}\n\n${fenced("ts", 'const real = await fs.realpath(full)\nif (!real.startsWith(root + path.sep)) throw new Error("symlink escapes")')}\n${fenced("bash", "npm run e2e -- --stage files")}`,
                },
                {
                    id: "files-3",
                    title: pick(l, "Giới hạn kích thước", "Limit the size"),
                    markdown: `${pick(l, "Đọc file lớn làm đầy context. Từ chối trước khi đọc.", "Reading a large file fills the context. Refuse before reading.")}\n\n${fenced("ts", 'const { size } = await fs.stat(real)\nif (size > 200_000) throw new Error("file too large")')}`,
                },
            ],
        },
        casesOf("files", [
            [pick(l, "đọc file trong dự án", "reads a file inside the project"), "green", ""],
            [pick(l, "ghi file trong dự án", "writes a file inside the project"), "green", ""],
            [
                pick(l, "chặn đường dẫn ra ngoài thư mục dự án", "blocks a path outside the project folder"),
                "red",
                pick(
                    l,
                    "ghi được ../outside.txt, đường dẫn chưa được chuẩn hóa",
                    "wrote ../outside.txt, the path was not normalized",
                ),
            ],
            [pick(l, "chặn symlink trỏ ra ngoài", "blocks a symlink that points outside"), "untested", ""],
            [pick(l, "từ chối file quá lớn", "refuses a file that is too large"), "untested", ""],
        ]),
    )

/** A locked stage of the agent CLI build: its cases and the one line that says when it opens. */
const agentCliLocked = (
    l: HarnessLocale,
    head: { readonly id: string; readonly title: string; readonly summary: string; readonly opensAfter: string },
    rows: ReadonlyArray<string>,
): HarnessStageView =>
    stageOf(
        {
            id: head.id,
            title: head.title,
            summary: head.summary,
            isLocked: true,
            steps: [
                {
                    id: `${head.id}-1`,
                    title: head.title,
                    markdown: pick(
                        l,
                        `Mở khóa sau khi ${head.opensAfter} xanh.`,
                        `Unlocks once ${head.opensAfter} is green.`,
                    ),
                },
            ],
        },
        casesOf(
            head.id,
            rows.map((title): CaseRow => [title, "untested", ""]),
        ),
    )

/** A short build given its stages as `[title, summary, case count]`, none of them run yet. */
const plainStages = (
    l: HarnessLocale,
    id: string,
    rows: ReadonlyArray<readonly [string, string, number]>,
): ReadonlyArray<HarnessStageView> =>
    rows.map(([title, summary, count], index) => {
        const stage = `${id}-s${index + 1}`
        const command = `npx @starci/next harness pull ${id}\nnpm run e2e -- --stage ${stage}`
        return stageOf(
            {
                id: stage,
                title,
                summary,
                isLocked: index > 0,
                steps: [
                    {
                        id: `${stage}-1`,
                        title: pick(l, "Bắt đầu chặng", "Start the stage"),
                        markdown: `${pick(l, "Tải source mẫu rồi chạy e2e của chặng.", "Pull the starter source and run the stage e2e.")}\n\n${fenced("bash", command)}`,
                    },
                ],
            },
            casesOf(
                stage,
                Array.from({ length: count }, (_, at): CaseRow => [
                    `${pick(l, "ca", "case")} ${at + 1}`,
                    "untested",
                    "",
                ]),
            ),
        )
    })

/** The stages of the agent CLI build, in the language asked. */
const agentCliStages = (l: HarnessLocale): ReadonlyArray<HarnessStageView> => [
    ...agentCliOpening(l),
    agentCliFiles(l),
    agentCliLocked(
        l,
        {
            id: "context",
            title: pick(l, "Context dài", "Long context"),
            summary: pick(l, "Cắt tỉa, nén, memory", "Trimming, compaction, memory"),
            opensAfter: pick(l, "chặng 3", "stage 3"),
        },
        [
            pick(l, "cắt tỉa kết quả tool cũ", "trims old tool results"),
            pick(l, "nén hội thoại khi gần đầy", "compacts the conversation near the limit"),
            pick(l, "giữ lại ghi chú qua lần nén", "keeps notes across a compaction"),
            pick(l, "đọc memory khi mở phiên mới", "loads memory in a new session"),
        ],
    ),
    agentCliLocked(
        l,
        {
            id: "mcp",
            title: pick(l, "MCP client và hỏi duyệt", "MCP client and approval"),
            summary: pick(l, "Cắm MCP, tool hành động phải xin phép", "Plug in MCP; an action tool must ask first"),
            opensAfter: pick(l, "chặng 4", "stage 4"),
        },
        [
            pick(l, "nối MCP server qua stdio", "connects an MCP server over stdio"),
            pick(l, "liệt kê tool của MCP", "lists the MCP tools"),
            pick(l, "tool ghi phải hỏi duyệt", "a write tool asks for approval"),
            pick(l, "từ chối thì model nhận lý do", "a refusal reaches the model with a reason"),
        ],
    ),
]

/** The four builds of part 1 as the harness teaches them, in the language asked. */
const buildsOf = (l: HarnessLocale): ReadonlyArray<HarnessBuildView> => [
    {
        id: "agent-cli",
        title: pick(l, "AI agent chạy bằng key của bạn", "An AI agent that runs on your key"),
        summary: pick(
            l,
            "Một CLI gọi model, chạy tool, đọc ghi file an toàn, giữ context dài và nối MCP.",
            "A CLI that calls a model, runs tools, reads and writes files safely, keeps a long context and plugs in MCP.",
        ),
        stack: ["TypeScript", "Claude", "OpenAI"],
        pullCommand: "npx @starci/next harness pull agent-cli",
        ranAt: "2026-11-17T09:20:00.000Z",
        stages: agentCliStages(l),
    },
    {
        id: "mcp-server",
        title: pick(l, "MCP server cho một shop", "An MCP server for a shop"),
        summary: pick(
            l,
            "Server MCP đưa sản phẩm và đơn hàng cho agent, quyền đọc và quyền ghi tách nhau.",
            "An MCP server that exposes products and orders to an agent, with read and write rights apart.",
        ),
        stack: ["TypeScript", "Express", "MCP"],
        pullCommand: "npx @starci/next harness pull mcp-server",
        ranAt: "",
        stages: plainStages(l, "mcp-server", [
            [
                pick(l, "Tool đọc sản phẩm", "A product read tool"),
                pick(l, "Liệt kê và tìm sản phẩm", "List and search products"),
                4,
            ],
            [
                pick(l, "Tool ghi đơn hàng", "An order write tool"),
                pick(l, "Tạo đơn có kiểm tra tồn kho", "Create an order with a stock check"),
                5,
            ],
            [
                pick(l, "Quyền và nhật ký", "Rights and audit log"),
                pick(l, "Mỗi lần ghi để lại dấu vết", "Every write leaves a trace"),
                4,
            ],
        ]),
    },
    {
        id: "chatbot-cskh",
        title: pick(l, "Chatbot chăm sóc khách hàng", "A customer support chatbot"),
        summary: pick(
            l,
            "Chatbot trả lời từ kho tri thức, biết lúc nào chuyển cho người.",
            "A chatbot that answers from a knowledge base and knows when to hand over to a person.",
        ),
        stack: ["TypeScript", "Express", "Claude"],
        pullCommand: "npx @starci/next harness pull chatbot-cskh",
        ranAt: "",
        stages: plainStages(l, "chatbot-cskh", [
            [
                pick(l, "Trả lời có nguồn", "Answer with sources"),
                pick(l, "Tìm trong kho tri thức rồi trích dẫn", "Search the knowledge base and cite"),
                4,
            ],
            [
                pick(l, "Chuyển cho người", "Hand over to a person"),
                pick(l, "Nhận ra câu hỏi ngoài phạm vi", "Spot a question out of scope"),
                4,
            ],
            [
                pick(l, "Đo chất lượng", "Measure quality"),
                pick(l, "Bộ câu hỏi mẫu và điểm", "A sample question set and a score"),
                3,
            ],
        ]),
    },
    {
        id: "lead-agent",
        title: pick(l, "Agent tìm lead", "A lead-finding agent"),
        summary: pick(
            l,
            "Agent tìm, lọc và chấm điểm khách tiềm năng, tôn trọng giới hạn truy cập.",
            "An agent that finds, filters and scores leads while respecting access limits.",
        ),
        stack: ["TypeScript", "Express", "OpenAI"],
        pullCommand: "npx @starci/next harness pull lead-agent",
        ranAt: "",
        stages: plainStages(l, "lead-agent", [
            [
                pick(l, "Tìm nguồn", "Find sources"),
                pick(l, "Gọi công cụ tìm kiếm có giới hạn tốc độ", "Call a search tool with a rate limit"),
                4,
            ],
            [
                pick(l, "Lọc và chấm điểm", "Filter and score"),
                pick(l, "Loại trùng, chấm theo tiêu chí", "Drop duplicates, score by criteria"),
                5,
            ],
            [
                pick(l, "Xuất kết quả", "Export the result"),
                pick(l, "Ghi ra file, không gửi dữ liệu đi đâu", "Write to a file, send nothing out"),
                3,
            ],
        ]),
    },
]

/** The summary row of one build: its counts come from the stages. */
const rowOf = (build: HarnessBuildView): HarnessBuildRowView => ({
    id: build.id,
    title: build.title,
    summary: build.summary,
    stack: build.stack,
    passed: build.stages.reduce((sum, stage) => sum + stage.passed, 0),
    total: build.stages.reduce((sum, stage) => sum + stage.total, 0),
    stagesGreen: build.stages.filter((stage) => stage.outcome === "green").length,
    stagesTotal: build.stages.length,
})

/** The rows of every build, for the hub and the list of part 1. */
export const buildRowsOf = (locale: HarnessLocale): ReadonlyArray<HarnessBuildRowView> => buildsOf(locale).map(rowOf)

/** One build with its stages, or undefined when none carries the id. */
export const buildOf = (id: string, locale: HarnessLocale): HarnessBuildView | undefined =>
    buildsOf(locale).find((each) => each.id === id)
