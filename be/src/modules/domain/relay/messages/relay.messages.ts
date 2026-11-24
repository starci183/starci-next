import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of relay errors, Vietnamese and English. */
export const RELAY_MESSAGES: MessageBundle = {
    vi: {
        "errors.RELAY_CODE_NOT_FOUND": "Mã ghép thiết bị không đúng hoặc đã hết hạn. Hãy chạy lại starci-relay login.",
        "errors.RELAY_DEVICE_LIMIT": "Bạn đã ghép đủ số thiết bị cho phép. Hãy thu hồi một thiết bị rồi thử lại.",
        "errors.RELAY_PENDING": "Thiết bị chưa được xác nhận trên web.",
        "errors.RELAY_DEVICE_REVOKED":
            "Thiết bị này đã bị thu hồi hoặc chưa được ghép. Hãy chạy lại starci-relay login.",
        "errors.RELAY_DEVICE_NOT_FOUND": "Không tìm thấy thiết bị này.",
        "errors.RELAY_PAIRING_INVALID": "Tên thiết bị hoặc hệ điều hành không hợp lệ.",
        "errors.RELAY_PAYLOAD_INVALID": "Dữ liệu gửi lên từ máy không hợp lệ hoặc quá lớn.",
        "errors.RELAY_UNAVAILABLE": "Chưa kết nối được tới máy chủ relay; hãy thử lại.",
        "errors.RELAY_LESSON_NOT_RUNNABLE":
            "Bài này chưa có kịch bản chạy được, hoặc không có kịch bản hay bậc thử thách đó.",
        "errors.RELAY_CHALLENGE_LOCKED": "Bậc thử thách này chưa mở: hãy làm xanh hết kịch bản ẩn của bậc dưới trước.",
        "errors.RELAY_PROJECT_PREMIUM_REQUIRED":
            "Chạy dự án cần Premium. Dự án cũ vẫn xem được, chỉ không nhận thêm lần chạy.",
        "errors.RELAY_DEVICE_OFFLINE":
            "Chưa có máy nào đang trực tuyến để chạy kịch bản. Mở starci-relay listen trên máy của bạn rồi thử lại.",
        "errors.RELAY_LAB_NOT_FOUND": "Bài này chưa có phòng lab.",
        "errors.RELAY_LAB_PREMIUM_REQUIRED": "Phòng lab của bài thuộc phần cần Premium.",
        "errors.RELAY_DEVICE_KEY_MISSING":
            "Máy đang trực tuyến chưa đăng ký khóa ký kết quả chấm. Hãy cập nhật starci-relay rồi ghép lại máy.",
        "errors.RELAY_DEVICE_KEY_LOCKED": "Máy này đã đăng ký khóa ký. Muốn đổi khóa, hãy ghép lại máy.",
        "errors.RELAY_DEVICE_KEY_INVALID": "Khóa ký gửi lên không phải khóa công khai Ed25519 hợp lệ.",
        "errors.RELAY_PAIR_CODE_NOT_FOUND":
            "Mã ghép 6 số không đúng, đã hết hạn hoặc đã dùng. Hãy lấy mã mới trên web.",
        "errors.RELAY_LAB_SUBMISSION_RUNNING":
            "Bài nộp trước của bạn vẫn đang được chấm trên máy. Hãy đợi kết quả rồi nộp lại.",
        "errors.RELAY_GRADE_REJECTED": "Kết quả chấm không thuộc bài nộp nào của bạn nên không được nhận.",
        "labels.RELAY_LAB_GRADED": "Đã chấm trên máy học viên",
        "labels.RELAY_LAB_PRACTICE": "Đang luyện",
    },
    en: {
        "errors.RELAY_CODE_NOT_FOUND": "The pairing code is wrong or has expired. Run starci-relay login again.",
        "errors.RELAY_DEVICE_LIMIT": "You have paired as many devices as your plan allows. Revoke one and try again.",
        "errors.RELAY_PENDING": "The device has not been confirmed on the web yet.",
        "errors.RELAY_DEVICE_REVOKED": "This device was revoked or is not paired. Run starci-relay login again.",
        "errors.RELAY_DEVICE_NOT_FOUND": "This device was not found.",
        "errors.RELAY_PAIRING_INVALID": "The device name or platform is not valid.",
        "errors.RELAY_PAYLOAD_INVALID": "What the machine sent is not valid or is too large.",
        "errors.RELAY_UNAVAILABLE": "The relay could not be reached; please try again.",
        "errors.RELAY_LESSON_NOT_RUNNABLE":
            "This lesson has no runnable scenarios yet, or no such scenario or challenge tier.",
        "errors.RELAY_CHALLENGE_LOCKED":
            "This challenge tier is locked: turn every hidden scenario of the tier below green first.",
        "errors.RELAY_PROJECT_PREMIUM_REQUIRED":
            "Running a project needs Premium. An older project stays readable but takes no new runs.",
        "errors.RELAY_DEVICE_OFFLINE":
            "No paired machine is online to run the scenario. Start starci-relay listen on your machine and try again.",
        "errors.RELAY_LAB_NOT_FOUND": "This lesson has no lab.",
        "errors.RELAY_LAB_PREMIUM_REQUIRED": "The lab of this lesson belongs to a part that needs Premium.",
        "errors.RELAY_DEVICE_KEY_MISSING":
            "The online machine has not registered a key to sign grading results. Update starci-relay and pair the machine again.",
        "errors.RELAY_DEVICE_KEY_LOCKED":
            "This machine already registered a signing key. To change the key, pair the machine again.",
        "errors.RELAY_DEVICE_KEY_INVALID": "The signing key sent is not a valid Ed25519 public key.",
        "errors.RELAY_PAIR_CODE_NOT_FOUND":
            "The 6-digit pairing code is wrong, expired or already used. Get a new one on the web.",
        "errors.RELAY_LAB_SUBMISSION_RUNNING":
            "Your previous submission is still being graded on your machine. Wait for the result, then submit again.",
        "errors.RELAY_GRADE_REJECTED":
            "The grading result does not belong to any submission of yours, so it was not accepted.",
        "labels.RELAY_LAB_GRADED": "Graded on the learner's machine",
        "labels.RELAY_LAB_PRACTICE": "Practising",
    },
}
