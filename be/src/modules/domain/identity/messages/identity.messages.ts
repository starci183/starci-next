import type { MessageBundle } from "@modules/platform/i18n"

/** Display text of the identity codes and of the emailed code, Vietnamese and English. */
export const IDENTITY_MESSAGES: MessageBundle = {
    vi: {
        "errors.IDENTITY_SESSION_REQUIRED": "Phiên đăng nhập không còn hiệu lực.",
        "errors.IDENTITY_SESSION_UNAVAILABLE": "Không thể truy cập phiên đăng nhập.",
        "errors.IDENTITY_PROVIDER_UNAVAILABLE": "Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại sau.",
        "errors.IDENTITY_UNAUTHENTICATED": "Bạn cần đăng nhập để thực hiện thao tác này.",
        "errors.IDENTITY_CREDENTIALS_REJECTED": "Email, tên đăng nhập hoặc mật khẩu không đúng.",
        "errors.IDENTITY_CODE_MISMATCH": "Mã xác nhận không đúng. Bạn còn {{attemptsLeft}} lần thử.",
        "errors.IDENTITY_CHALLENGE_EXPIRED": "Mã xác nhận đã hết hạn. Vui lòng thực hiện lại từ đầu.",
        "errors.IDENTITY_EMAIL_REGISTERED": "Email này đã có tài khoản.",
        "errors.IDENTITY_PASSWORD_INVALID": "Mật khẩu phải có từ 6 đến 256 ký tự và đúng chính sách mật khẩu.",
        "errors.IDENTITY_USERNAME_INVALID": "Tên đăng nhập phải có từ 3 đến 100 ký tự.",
        "errors.IDENTITY_PROVIDER_UNKNOWN": "Nhà cung cấp đăng nhập không được hỗ trợ.",
        "errors.IDENTITY_SOCIAL_STATE_INVALID": "Phiên đăng nhập xã hội không hợp lệ hoặc đã hết hạn.",
        "errors.IDENTITY_SOCIAL_REJECTED": "Đăng nhập bằng tài khoản xã hội không thành công.",
        "mail.code.sign-in.subject": "Mã đăng nhập StarCi: {{code}}",
        "mail.code.sign-in.text":
            "Mã đăng nhập StarCi của bạn là {{code}}. Mã có hiệu lực trong {{minutes}} phút. Nếu bạn không đăng nhập, hãy bỏ qua email này.",
        "mail.code.sign-up.subject": "Mã xác nhận đăng ký StarCi: {{code}}",
        "mail.code.sign-up.text":
            "Mã xác nhận đăng ký StarCi của bạn là {{code}}. Mã có hiệu lực trong {{minutes}} phút. Nếu bạn không đăng ký, hãy bỏ qua email này.",
        "mail.code.password-reset.subject": "Mã đặt lại mật khẩu StarCi: {{code}}",
        "mail.code.password-reset.text":
            "Mã đặt lại mật khẩu StarCi của bạn là {{code}}. Mã có hiệu lực trong {{minutes}} phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.",
    },
    en: {
        "errors.IDENTITY_SESSION_REQUIRED": "A current session is required.",
        "errors.IDENTITY_SESSION_UNAVAILABLE": "Session state is unavailable.",
        "errors.IDENTITY_PROVIDER_UNAVAILABLE": "The sign-in service is unavailable. Please try again later.",
        "errors.IDENTITY_UNAUTHENTICATED": "You need to sign in to do this.",
        "errors.IDENTITY_CREDENTIALS_REJECTED": "The email, username or password is incorrect.",
        "errors.IDENTITY_CODE_MISMATCH": "The code is incorrect. You have {{attemptsLeft}} attempts left.",
        "errors.IDENTITY_CHALLENGE_EXPIRED": "The code has expired. Please start again.",
        "errors.IDENTITY_EMAIL_REGISTERED": "This email already has an account.",
        "errors.IDENTITY_PASSWORD_INVALID": "The password must be 6 to 256 characters and meet the password policy.",
        "errors.IDENTITY_USERNAME_INVALID": "The username must be 3 to 100 characters.",
        "errors.IDENTITY_PROVIDER_UNKNOWN": "That sign-in provider is not supported.",
        "errors.IDENTITY_SOCIAL_STATE_INVALID": "The social sign-in is invalid or has expired.",
        "errors.IDENTITY_SOCIAL_REJECTED": "The social sign-in was not successful.",
        "mail.code.sign-in.subject": "Your StarCi sign-in code: {{code}}",
        "mail.code.sign-in.text":
            "Your StarCi sign-in code is {{code}}. It is valid for {{minutes}} minutes. If you did not try to sign in, ignore this email.",
        "mail.code.sign-up.subject": "Your StarCi sign-up code: {{code}}",
        "mail.code.sign-up.text":
            "Your StarCi sign-up code is {{code}}. It is valid for {{minutes}} minutes. If you did not sign up, ignore this email.",
        "mail.code.password-reset.subject": "Your StarCi password reset code: {{code}}",
        "mail.code.password-reset.text":
            "Your StarCi password reset code is {{code}}. It is valid for {{minutes}} minutes. If you did not ask for it, ignore this email.",
    },
}
