import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of agent lab errors, Vietnamese and English. */
export const AGENT_LAB_MESSAGES: MessageBundle = {
    vi: {
        "errors.AGENT_LAB_TRACK_NOT_FOUND": "Không tìm thấy công cụ này trong khu Agent.",
        "errors.AGENT_LAB_QUOTA_EXHAUSTED":
            "Bạn đã dùng hết lượt gọi model hôm nay; lab dừng đến ngày mai, hoặc gắn key của bạn để chạy tiếp.",
        "errors.AGENT_LAB_CONFIG_INVALID": "Hạn mức gọi model mỗi ngày của khu Agent không hợp lệ.",
    },
    en: {
        "errors.AGENT_LAB_TRACK_NOT_FOUND": "This tool was not found in the agent lab.",
        "errors.AGENT_LAB_QUOTA_EXHAUSTED":
            "You used every model call for today; the lab stops until tomorrow, or attach your own key to keep going.",
        "errors.AGENT_LAB_CONFIG_INVALID": "The daily model-call limit of the agent lab is not valid.",
    },
}

/** The Vietnamese and English copy of the catalog: the seven mindset concepts and the tool tracks (the canvas copy). */
export const AGENT_LAB_COPY: MessageBundle = {
    vi: {
        "concept.task-spec.label": "Giao việc rõ",
        "concept.task-spec.evidence": "Tiêu chí đạt viết trước khi chạy agent",
        "concept.context.label": "Đưa đúng ngữ cảnh",
        "concept.context.evidence": "Tài liệu, trí nhớ, skill agent được thấy và không được thấy",
        "concept.tools-permissions.label": "Công cụ và quyền tối thiểu",
        "concept.tools-permissions.evidence": "Danh sách công cụ cho phép, sandbox, duyệt trước khi chạy",
        "concept.verify.label": "Kiểm chứng trước khi tin",
        "concept.verify.evidence": "Eval chạy trên CI, bạn giải thích được kết quả",
        "concept.decompose.label": "Chia việc",
        "concept.decompose.evidence": "Bước hoặc subagent có phạm vi rời nhau",
        "concept.cost-limits.label": "Chi phí và giới hạn",
        "concept.cost-limits.evidence": "Model, ngân sách token, timeout, retry",
        "concept.operate.label": "Vận hành",
        "concept.operate.evidence": "Log, xử lý lỗi, giữ trí nhớ sạch",
        "track.claude.label": "Claude Code + Agent SDK",
        "track.claude.focus": "Agent viết code và agent dựng bằng SDK, chạy bằng tài khoản Anthropic của bạn",
        "track.openclaw.label": "OpenClaw",
        "track.openclaw.focus": "Agent cá nhân tự host, nhận việc qua chat",
        "track.hermes.label": "Hermes Agent",
        "track.hermes.focus": "Không gắn model, có trí nhớ và tự tạo skill",
    },
    en: {
        "concept.task-spec.label": "Clear task spec",
        "concept.task-spec.evidence": "Acceptance criteria written before the agent runs",
        "concept.context.label": "Right context",
        "concept.context.evidence": "The docs, memory and skills the agent may and may not see",
        "concept.tools-permissions.label": "Tools and least permission",
        "concept.tools-permissions.evidence": "An allowlist of tools, a sandbox and approval before running",
        "concept.verify.label": "Verify before trusting",
        "concept.verify.evidence": "Evals that run in CI, and you can explain the result",
        "concept.decompose.label": "Decompose the work",
        "concept.decompose.evidence": "Steps or subagents with disjoint scope",
        "concept.cost-limits.label": "Cost and limits",
        "concept.cost-limits.evidence": "Model choice, token budget, timeouts and retries",
        "concept.operate.label": "Operate",
        "concept.operate.evidence": "Logs, failure handling and clean memory",
        "track.claude.label": "Claude Code + Agent SDK",
        "track.claude.focus": "Coding agents and SDK-built agents, run on your own Anthropic account",
        "track.openclaw.label": "OpenClaw",
        "track.openclaw.focus": "A self-hosted personal agent that takes work through chat",
        "track.hermes.label": "Hermes Agent",
        "track.hermes.focus": "Model-agnostic, with persistent memory and self-made skills",
    },
}
