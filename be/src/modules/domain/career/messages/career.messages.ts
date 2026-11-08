import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of career errors, and the CV-line templates of the experience catalog (`lines.<itemType>`), Vietnamese and English. */
export const CAREER_MESSAGES: MessageBundle = {
    vi: {
        "errors.CAREER_ITEM_NOT_FOUND": "Không tìm thấy mục kinh nghiệm này.",
        "errors.CAREER_PREMIUM_REQUIRED": "Gửi thầy duyệt kinh nghiệm cần gói Premium.",
        "errors.CAREER_STATE_CONFLICT": "Mục này không ở trạng thái cho phép thao tác đó; hãy tải lại.",
        "errors.CAREER_LINE_SLOT_CHANGED":
            "Bạn sửa được câu chữ nhưng không sửa được số liệu và giá trị lấy từ bằng chứng.",
        "errors.CAREER_RESUBMIT_UNCHANGED": "Hãy sửa dòng CV hoặc bổ sung bằng chứng trước khi gửi lại.",
        "errors.CAREER_NOT_VERIFIED": "Chỉ mục Đã xác minh mới làm được việc này.",
        "errors.CAREER_REVIEW_FORBIDDEN": "Bạn không có quyền duyệt mục này.",
        "errors.CAREER_SELF_REVIEW": "Không ai được tự duyệt mục của chính mình.",
        "errors.CAREER_REVIEW_CONFLICT": "Mục này vừa được người khác quyết định; hãy tải lại.",
        "errors.CAREER_REVIEW_NOTE_REQUIRED": "Trả lại hoặc thu hồi cần kèm ghi chú.",
        "errors.CAREER_REVIEWER_NOT_FOUND": "Không tìm thấy người duyệt này.",
        "errors.CAREER_ITEM_TYPE_UNKNOWN": "Loại kinh nghiệm này không có trong danh mục.",
        "errors.CAREER_ITEM_NOT_SAVED": "Không thể lưu mục kinh nghiệm; hãy thử lại.",
        "errors.CAREER_DEV_SEED_DISABLED": "Dữ liệu mẫu kinh nghiệm chỉ chạy được trong môi trường phát triển.",
        "lines.essentials.concept-proved":
            "Áp dụng **<concept>** trong dự án <project> bằng **<language>**: tự viết test bắt được lỗi được gieo sẵn ở bài <lesson> (StarCi Bản chất).",
        "lines.projects.milestone":
            "Xây <project> bằng **<stack>**, áp dụng **<concepts>**; mỗi khái niệm có test hoặc luồng e2e chạy trong CI <ci>.",
        "lines.projects.deployed":
            "Triển khai <project> tại <url> với health và readiness check; vượt bộ kiểm tra của StarCi gồm lặp request cùng khóa, request song song và input sai.",
        "lines.projects.agent-built":
            "Xây agent <project> trên **<tool>** với allowlist công cụ, giới hạn chi phí và eval chạy trong CI; agent vượt kiểm tra prompt injection và phân quyền của StarCi.",
        "lines.projects.ai-coding-mindset":
            "Phát triển <project> cùng coding agent **<tool>**: viết tiêu chí chấp nhận trước khi giao việc, giới hạn quyền công cụ, chia việc cho subagent và chỉ merge khi test trong CI pass.",
        "lines.incidents.fixed":
            "Tìm và sửa lỗi **<bugClass>** trong repo sự cố <lesson>, viết test bắt được bug còn sống sót (mutation score **<score>**% do StarCi chạy lại trên server).",
        "lines.practice.pattern-solved":
            "Giải **<count>** bài dạng **<pattern>** đạt Accepted trên bộ test ẩn bằng **<language>**, không dùng lời giải mẫu.",
        "lines.interview.pass": "Đạt phỏng vấn thử **<tier>** track <track> của StarCi, chấm theo rubric của thầy.",
    },
    en: {
        "errors.CAREER_ITEM_NOT_FOUND": "This experience item was not found.",
        "errors.CAREER_PREMIUM_REQUIRED": "Sending experience for review needs Premium.",
        "errors.CAREER_STATE_CONFLICT": "This item is not in a state that allows this; reload it.",
        "errors.CAREER_LINE_SLOT_CHANGED":
            "You can reword the line, but not the figures and values taken from the evidence.",
        "errors.CAREER_RESUBMIT_UNCHANGED": "Change the line or add evidence before you resubmit.",
        "errors.CAREER_NOT_VERIFIED": "Only a verified item allows this.",
        "errors.CAREER_REVIEW_FORBIDDEN": "You may not review this item.",
        "errors.CAREER_SELF_REVIEW": "Nobody may review their own item.",
        "errors.CAREER_REVIEW_CONFLICT": "Someone else just decided this item; reload it.",
        "errors.CAREER_REVIEW_NOTE_REQUIRED": "A return or a revoke needs a note.",
        "errors.CAREER_REVIEWER_NOT_FOUND": "This reviewer was not found.",
        "errors.CAREER_ITEM_TYPE_UNKNOWN": "This experience type is not in the catalog.",
        "errors.CAREER_ITEM_NOT_SAVED": "The experience item could not be saved; try again.",
        "errors.CAREER_DEV_SEED_DISABLED": "The sample experience items run in the development environment only.",
        "lines.essentials.concept-proved":
            "Applied **<concept>** in the <project> project in **<language>**: wrote tests that caught the seeded bug of the <lesson> lesson (StarCi Essentials).",
        "lines.projects.milestone":
            "Built <project> with **<stack>**, applying **<concepts>**, each covered by tests or e2e flows running in CI <ci>.",
        "lines.projects.deployed":
            "Deployed <project> at <url> with health and readiness checks; passed StarCi's probes for repeated keys, parallel requests and invalid input.",
        "lines.projects.agent-built":
            "Built the <project> agent on **<tool>** with a tool allowlist, cost limits and evals in CI; it passed StarCi's prompt-injection and permission probes.",
        "lines.projects.ai-coding-mindset":
            "Developed <project> with the **<tool>** coding agent: acceptance criteria before each task, least-privilege tool permissions, subagents on separate scopes, and merges only on green CI tests.",
        "lines.incidents.fixed":
            "Found and fixed a **<bugClass>** in the <lesson> incident repo, with tests that catch the surviving bug (mutation score **<score>**%, rerun by StarCi on the server).",
        "lines.practice.pattern-solved":
            "Solved **<count>** **<pattern>** problems, Accepted on hidden tests, in **<language>**, without the reference solution.",
        "lines.interview.pass":
            "Passed the StarCi **<tier>** mock interview, track <track>, graded on the teacher's rubric.",
    },
}
