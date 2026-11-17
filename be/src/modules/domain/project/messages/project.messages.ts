import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of project errors, Vietnamese and English. */
export const PROJECT_MESSAGES: MessageBundle = {
    vi: {
        "errors.PROJECT_NOT_FOUND": "Không tìm thấy dự án này trong danh sách của bạn.",
        "errors.PROJECT_MILESTONE_NOT_FOUND": "Không có milestone này trong danh mục.",
        "errors.PROJECT_CONCEPT_NOT_FOUND": "Không có concept này trong danh mục milestone.",
        "errors.PROJECT_CONCEPT_NOT_READY": "Concept này thầy đang soạn bài Bản chất, chưa thể chấm.",
        "errors.PROJECT_PREMIUM_REQUIRED":
            "Dự án cần Premium: tạo dự án, chạy kiểm tra, nộp bằng chứng và nhờ thầy AI đọc code đều cần gói đang hiệu lực. Dự án cũ vẫn xem được, chỉ không chạy thêm.",
        "errors.PROJECT_INPUT_INVALID": "Thông tin dự án chưa hợp lệ.",
        "errors.PROJECT_LOCATION_INVALID":
            "Vị trí code phải là đường dẫn tương đối trong repo, không phải file bí mật.",
        "errors.PROJECT_EXPLANATION_INVALID": "Hãy giải thích trong 2 đến 3 câu, không quá 600 ký tự.",
        "errors.PROJECT_ENDPOINT_INVALID": "Endpoint phải có dạng METHOD /đường-dẫn và body mẫu phải là JSON nhỏ.",
        "errors.PROJECT_TARGET_REFUSED": "Chỉ nhận địa chỉ http hoặc https công khai, không nhận địa chỉ nội bộ.",
        "errors.PROJECT_DEPLOYED_URL_MISSING": "Dự án chưa khai báo địa chỉ đã triển khai để StarCi kiểm tra.",
        "errors.PROJECT_EXCERPT_SECRET":
            "Đoạn code có giá trị giống bí mật nên không gửi cho thầy AI; hãy đổi khoá đó ngay.",
        "errors.PROJECT_CODE_READ_LIMIT": "Bạn đã dùng hết lượt thầy AI đọc code hôm nay; thử lại ngày mai.",
        "errors.PROJECT_PROBE_RATE_LIMITED": "Dự án này vừa được kiểm tra nhiều lần; thử lại sau ít phút.",
        "errors.PROJECT_CI_SIGNATURE_INVALID": "Chữ ký của kết quả CI không khớp với dự án.",
        "errors.PROJECT_REPOSITORY_INVALID": "Kho GitHub phải có dạng chủ-sở-hữu/tên-kho, ví dụ starci/shop.",
        "errors.PROJECT_CI_STALE": "Kết quả CI nằm ngoài cửa sổ thời gian cho phép.",
        "errors.PROJECT_CI_PAYLOAD_INVALID": "Kết quả CI không đúng định dạng.",
        "errors.PROJECT_COACH_UNCONFIGURED": "Thầy AI chưa được bật nên chưa chấm được phần đọc code.",
        "errors.PROJECT_COACH_UNAVAILABLE": "Thầy AI đang bận; hãy thử lại sau ít phút.",
        "errors.PROJECT_CHECKS_UNAVAILABLE": "Bộ kiểm tra của Dự án chưa sẵn sàng; hãy thử lại sau.",
        "errors.PROJECT_COACH_INVALID": "Thầy AI trả lời không đúng dạng; hãy thử lại.",
    },
    en: {
        "errors.PROJECT_NOT_FOUND": "This project is not in your list.",
        "errors.PROJECT_MILESTONE_NOT_FOUND": "This milestone is not in the catalog.",
        "errors.PROJECT_CONCEPT_NOT_FOUND": "This concept is not in the milestone catalog.",
        "errors.PROJECT_CONCEPT_NOT_READY":
            "The teacher is still writing this concept's Essentials lesson, so it cannot be graded yet.",
        "errors.PROJECT_PREMIUM_REQUIRED":
            "Projects need Premium: creating a project, running checks, sending evidence and the AI code read all need an active plan. An older project stays readable but takes no new runs.",
        "errors.PROJECT_INPUT_INVALID": "The project details are not valid.",
        "errors.PROJECT_LOCATION_INVALID":
            "The code location must be a relative path inside the repo and not a secret file.",
        "errors.PROJECT_EXPLANATION_INVALID": "Explain in 2 to 3 sentences, at most 600 characters.",
        "errors.PROJECT_ENDPOINT_INVALID":
            "The endpoint must look like METHOD /path and the sample body must be small JSON.",
        "errors.PROJECT_TARGET_REFUSED": "Only public http or https addresses are accepted, never internal ones.",
        "errors.PROJECT_DEPLOYED_URL_MISSING": "The project declares no deployed address for StarCi to probe.",
        "errors.PROJECT_EXCERPT_SECRET":
            "The excerpt holds a secret-like value so it is not sent to the AI teacher; rotate that key now.",
        "errors.PROJECT_CODE_READ_LIMIT": "You used every AI code read for today; try again tomorrow.",
        "errors.PROJECT_PROBE_RATE_LIMITED": "This project was probed many times just now; try again in a few minutes.",
        "errors.PROJECT_CI_SIGNATURE_INVALID": "The signature of the CI result does not match the project.",
        "errors.PROJECT_REPOSITORY_INVALID": "The GitHub repository must be owner/name, for example starci/shop.",
        "errors.PROJECT_CI_STALE": "The CI result is outside the allowed time window.",
        "errors.PROJECT_CI_PAYLOAD_INVALID": "The CI result is not in the expected format.",
        "errors.PROJECT_COACH_UNCONFIGURED": "The AI teacher is not enabled, so the code read cannot be graded.",
        "errors.PROJECT_COACH_UNAVAILABLE": "The AI teacher is busy; try again in a few minutes.",
        "errors.PROJECT_CHECKS_UNAVAILABLE": "The project checks are not ready yet; try again later.",
        "errors.PROJECT_COACH_INVALID": "The AI teacher answered in the wrong shape; try again.",
    },
}
