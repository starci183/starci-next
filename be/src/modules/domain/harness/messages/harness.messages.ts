import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of harness errors and the fixed words of the hub, Vietnamese and English. */
export const HARNESS_MESSAGES: MessageBundle = {
    vi: {
        "errors.HARNESS_NOT_FOUND": "Không tìm thấy nội dung harness này.",
        "errors.HARNESS_REPOSITORY_INVALID": "Hãy nhập repo GitHub dạng owner/tên hoặc địa chỉ github.com.",
        "errors.HARNESS_CI_BINDING_UNKNOWN": "Không có liên kết harness nào với mã này.",
        "errors.HARNESS_CI_PAYLOAD_INVALID": "Báo cáo CI không đúng định dạng.",
        "errors.HARNESS_CI_NOT_ATTESTED":
            "GitHub chưa xác nhận lần chạy này: hãy bật permissions id-token: write và chạy từ đúng repo đã liên kết.",
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
        "errors.HARNESS_REPOSITORY_INVALID": "Enter a GitHub repository as owner/name or a github.com address.",
        "errors.HARNESS_CI_BINDING_UNKNOWN": "No harness binding has this id.",
        "errors.HARNESS_CI_PAYLOAD_INVALID": "The CI report is not in the expected format.",
        "errors.HARNESS_CI_NOT_ATTESTED":
            "GitHub did not vouch for this run: enable permissions id-token: write and run it from the bound repository.",
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
