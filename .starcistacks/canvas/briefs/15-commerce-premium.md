# Premium  (gallery: commerce/premium, route /premium)
Mục tiêu: hiểu Premium mở gì rồi trả tiền mà không rời trang.
Thao tác: premiumPlans (tháng 229.000 ₫, năm 2.290.000 ₫, giá do server giữ), myPremium (isPremium, premiumUntil, lastRail), startPremiumCheckout (plan, rail) rồi premiumOrder để chờ trạng thái. cần API: startPremiumCheckout trả dữ liệu QR (chuỗi VietQR, ngân hàng, số tài khoản, nội dung, expiresAt) thay vì chỉ redirect.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/15-commerce-premium.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: commerce/premium (Premium, chọn gói; 1440 và 390); commerce/premium-qr-payment (Premium, thanh toán QR; 1440 và 390); commerce/premium-qr-expired (Premium, mã QR hết hạn; chỉ 390); commerce/premium-checkout-error (Premium, lỗi tạo thanh toán; chỉ 390); commerce/premium-has-premium (Premium, đã có Premium; chỉ 390); commerce/premium-loading (Premium, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: hiểu Premium mở gì rồi trả tiền mà không rời trang. premiumPlans (tháng 229.000 ₫, năm 2.290.000 ₫, giá do server giữ), myPremium (isPremium, premiumUntil, lastRail), startPremiumCheckout (plan, rail) rồi premiumOrder để chờ trạng thái. Dải tiêu đề không có nút; cột trái là bảng so sánh phẳng Miễn phí và Premium theo ba khu vực cộng số máy CLI (1 và 2), rồi ba câu hỏi nhanh; cột phải 400px là thẻ gói: hai dòng chọn gói (năm có nhãn xanh "Tiết kiệm 2 tháng"), tóm tắt.
Grammar: Section, DataTable phẳng, RadioGroup appearance="rows", CopyField, Alert, Badge, Spinner. cần Grammar: QrCode (ảnh mã QR).
Hành động chính: "Thanh toán 2.290.000 ₫"; đã Premium thì "Gia hạn".
Lọc: không có.
Việc đổi: bảng so sánh theo khu vực thay danh sách "includes"; trả bằng QR ngay tại trang thay vì chuyển hướng.
Xung đột: backend có hai rail (sepay, payos) và trả redirect; bản vẽ chỉ hiện SePay và ẩn lựa chọn rail. Hết hạn giữ tiến độ, mua thêm cộng dồn thời gian, không tự gia hạn (giả định, chờ chốt).
