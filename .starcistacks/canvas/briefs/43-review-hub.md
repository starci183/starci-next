# Ôn tập  (gallery: review/hub, route /review)
Mục tiêu: biết hôm nay phải ôn gì và bắt đầu ngay; Ôn tập miễn phí.
Thao tác: reviewToday (due, overdue, newAvailable, goal, items với nguồn và hạn), reviewStats (activeDaysPerWeek, recallRateByReview), setReviewGoal, reviewDecks. cần API: bỏ khóa thẻ (lockedCount) khỏi reviewToday.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/43-review-hub.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: review/hub (Ôn tập, có thẻ đến hạn; 1440 và 390); review/hub-done-today (Ôn tập, hôm nay xong; chỉ 390); review/hub-empty (Ôn tập, không có gì đến hạn; chỉ 390); review/hub-first-visit (Ôn tập, lần đầu; chỉ 390); review/hub-change-goal (Ôn tập, đổi mục tiêu; chỉ 390); review/hub-error (Ôn tập, lỗi tải; chỉ 390); review/hub-loading (Ôn tập, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: no-match, detail, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: biết hôm nay phải ôn gì và bắt đầu ngay; Ôn tập miễn phí.
Grammar: PageHeader, Section kind="figures", Section kind="list", ListRow, BarChart, Select (mục tiêu mỗi ngày), Dialog, Badge. cần Grammar: không có.
Hành động chính: "Bắt đầu ôn 8 thẻ"; xong mục tiêu thì không còn nút chính, chỉ "Ôn thêm thẻ mới" trung tính; không có gì đến hạn thì "Chọn bộ thẻ".
Lọc: không có.
Việc đổi: thêm biểu đồ nhớ và danh sách sắp ôn thay vì chỉ một con số.
Xung đột: reviewToday còn lockedCount; Ôn tập miễn phí nên giao diện bỏ qua.
