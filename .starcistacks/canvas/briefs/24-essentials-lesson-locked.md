# Phần khóa  (gallery: essentials/lesson-locked, route /essentials/[topic]/[lesson]?part=source)
Mục tiêu: tài khoản miễn phí đọc hết phần 1 không bị chặn; mở phần 2–4 thì hiểu sẽ được gì và vì sao chưa vào được.
Thao tác: lesson(id).essential.isLocked và lockedParts; lesson.isPremium; myPremium. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/24-essentials-lesson-locked.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: essentials/lesson-locked (Phần khóa, phần 2; 1440 và 390); essentials/lesson-locked-part-3 (Phần khóa, phần 3; chỉ 390); essentials/lesson-locked-part-4 (Phần khóa, phần 4; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: tài khoản miễn phí đọc hết phần 1 không bị chặn; mở phần 2–4 thì hiểu sẽ được gì và vì sao chưa vào được. lesson(id).essential.isLocked và lockedParts; lesson.isPremium; myPremium. Thanh đầu bài giữ nguyên, ba tab sau có ổ khóa thay cho số đếm; một thông báo nêu thẳng "Phần n · tên thuộc gói Premium", nói điểm và tiến độ giữ nguyên khi nâng cấp, kèm "Quay lại phần 1" và liên kết "So sánh hai gói"; dưới là ba dòng phần đó có gì và sơ đồ xem trước mờ, không bấm được.
Grammar: Tabs, Alert (LockedNotice), Button, Section kind="list", ListRow state="unavailable". cần Grammar: không có.
Hành động chính: "Nâng cấp Premium".
Lọc: không có.
Việc đổi: khóa bằng một thông báo rõ nghĩa thay vì ẩn tab.
Xung đột: nội dung so sánh Miễn phí và Premium chờ chủ sản phẩm chốt.
