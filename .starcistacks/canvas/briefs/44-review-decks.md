# Bộ thẻ  (gallery: review/decks, route /review/decks)
Mục tiêu: chọn bộ thẻ muốn ôn.
Thao tác: reviewDecks (deckId, title, description, difficulty, track, course, cardCount, added), addReviewDeck (trả newCards), removeReviewDeck. cần API: không có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/44-review-decks.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: review/decks (Bộ thẻ, danh sách; 1440 và 390); review/decks-deck-added (Bộ thẻ, vừa thêm một bộ; chỉ 390); review/decks-empty (Bộ thẻ, chưa thêm bộ nào; chỉ 390); review/decks-error (Bộ thẻ, lỗi tải; chỉ 390); review/decks-loading (Bộ thẻ, đang tải; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Breadcrumbs, Section kind="list" có filter, ListRow, Tabs kind="filter", Badge, Toast. cần Grammar: không có.
Hành động chính: không có: mỗi hàng có lệnh ngang hàng "Thêm bộ thẻ", không giả một nút chính.
Lọc: hai dải Tabs kind="filter": đã thêm/chưa thêm và lộ trình.
Việc đổi: bộ lọc đứng trên danh sách, không tụt xuống cuối ở 390.
Xung đột: Ôn tập miễn phí nên không có thẻ khóa.
