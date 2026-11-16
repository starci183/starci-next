import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of mcp errors, Vietnamese and English. */
export const MCP_MESSAGES: MessageBundle = {
    vi: {
        "errors.MCP_TOKEN_INVALID":
            "Mã truy cập không đúng hoặc đã bị thu hồi. Hãy tạo mã mới ở trang Kết nối Claude / ChatGPT.",
        "errors.MCP_TOKEN_LIMIT": "Bạn đã tạo đủ số mã truy cập cho phép. Hãy thu hồi một mã rồi thử lại.",
        "errors.MCP_TOKEN_NAME_INVALID": "Tên mã truy cập không hợp lệ.",
        "errors.MCP_TOKEN_NOT_FOUND": "Không tìm thấy mã truy cập này.",
        "errors.MCP_PREMIUM_REQUIRED":
            "Đọc source, xem kịch bản và chạy lại kịch bản cần Premium, như workspace của bài.",
        "errors.MCP_SOURCE_UNAVAILABLE": "Bài này chưa có source hoặc kịch bản trên máy chủ.",
        "errors.MCP_PATH_FORBIDDEN": "Đường dẫn này nằm ngoài source của bài hoặc không được mở cho AI đọc.",
        "errors.MCP_FILE_NOT_FOUND": "Không có tệp này trong source của bài.",
        "errors.MCP_SCENARIO_UNKNOWN": "Kịch bản hoặc công tắc guard này không có trong bài.",
        "errors.MCP_DEVICE_OFFLINE": "Chưa có máy nào đang kết nối. Hãy mở starci-next trên máy của bạn rồi thử lại.",
    },
    en: {
        "errors.MCP_TOKEN_INVALID":
            "The access token is wrong or revoked. Create a new one on the Connect Claude / ChatGPT page.",
        "errors.MCP_TOKEN_LIMIT": "You have created as many access tokens as allowed. Revoke one and try again.",
        "errors.MCP_TOKEN_NAME_INVALID": "The access token name is not valid.",
        "errors.MCP_TOKEN_NOT_FOUND": "This access token was not found.",
        "errors.MCP_PREMIUM_REQUIRED":
            "Reading source, listing scenarios and re-running them need Premium, like the lesson workspace.",
        "errors.MCP_SOURCE_UNAVAILABLE": "This lesson has no source or scenarios on the server yet.",
        "errors.MCP_PATH_FORBIDDEN": "This path is outside the lesson source or is not open to the AI.",
        "errors.MCP_FILE_NOT_FOUND": "The lesson source has no such file.",
        "errors.MCP_SCENARIO_UNKNOWN": "This scenario or guard switch is not part of the lesson.",
        "errors.MCP_DEVICE_OFFLINE": "No device is connected. Open starci-next on your machine and try again.",
    },
}
