import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of harness errors and the fixed words of the hub, Vietnamese and English. */
export const HARNESS_MESSAGES: MessageBundle = {
    vi: {
        "errors.HARNESS_NOT_FOUND": "Không tìm thấy nội dung harness này.",
        "errors.HARNESS_PROJECT_INVALID": "Dự án này không phải dự án agent của bạn.",
        "errors.HARNESS_CONTENT_INVALID": "Nội dung harness có lỗi nên chưa được nhập.",
        "errors.HARNESS_VERSION_CONFLICT": "Phiên bản này đã có với nội dung khác.",
        "errors.HARNESS_IMPORT_REJECTED": "Không nhập được nội dung harness từ thư mục này.",
        "part.build.title": "Xây",
        "part.build.summary": "Dựng bốn sản phẩm agent thật, từng chặng, bằng khoá API của chính bạn.",
        "part.use.title": "Xài",
        "part.use.summary": "Dùng Claude Code và Codex đúng cách; doctor và trial kiểm trên máy bạn.",
        "part.docs.title": "Tài liệu",
        "part.docs.summary": "Toàn bộ tài liệu của harness StarCi cho người tò mò.",
    },
    en: {
        "errors.HARNESS_NOT_FOUND": "This harness content was not found.",
        "errors.HARNESS_PROJECT_INVALID": "This project is not one of your agent projects.",
        "errors.HARNESS_CONTENT_INVALID": "The harness content has findings, so it was not imported.",
        "errors.HARNESS_VERSION_CONFLICT": "This version already exists with other content.",
        "errors.HARNESS_IMPORT_REJECTED": "The harness content could not be imported from this folder.",
        "part.build.title": "Build",
        "part.build.summary": "Build four real agent products stage by stage with your own API key.",
        "part.use.title": "Use",
        "part.use.summary": "Use Claude Code and Codex the right way; doctor and trial check your machine.",
        "part.docs.title": "Docs",
        "part.docs.summary": "The full docs of the StarCi harness, for the curious.",
    },
}
