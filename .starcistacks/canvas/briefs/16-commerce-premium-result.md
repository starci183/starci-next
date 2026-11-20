# Kết quả thanh toán  (gallery: commerce/premium-result, route /premium/result)
Mục tiêu: nói rõ đơn đang ở đâu; đường dẫn quay về không bao giờ được coi là bằng chứng đã trả.
Thao tác: premiumOrder(orderId) trả status verifying, active, failed hoặc expired cùng plan, amountVnd, rail, orderCode, premiumUntil; trang hỏi lại định kỳ khi đang verifying. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/16-commerce-premium-result.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: commerce/premium-result (Kết quả thanh toán, đang xác nhận; 1440 và 390); commerce/premium-result-unlocked (Kết quả thanh toán, Premium đã mở; 1440 và 390); commerce/premium-result-failed (Kết quả thanh toán, thất bại; chỉ 390); commerce/premium-result-expired (Kết quả thanh toán, hết hạn; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: Một cột giữa: biểu tượng trạng thái, tiêu đề, một câu giải thích, bảng mã đơn phẳng (mã, gói, số tiền, kênh, hạn Premium khi đã mở), một nút.
Grammar: Page, EmptyNotice, DescriptionList, Spinner, Button. cần Grammar: không có.
Hành động chính: active "Mở Projects", failed "Thử lại", expired "Tạo mã mới"; đang xác nhận chỉ có nút trung tính "Về trang Học".
Lọc: không có.
Việc đổi: thêm lời trấn an khi đã chuyển tiền mà quá hạn, kèm mã đơn để tra.
Xung đột: không.
