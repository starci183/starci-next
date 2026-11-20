# Một bộ thẻ  (gallery: review/deck, route /review/decks/[deckId])
Mục tiêu: xem bộ thẻ có gì trước khi thêm và quản lý nó sau khi thêm.
Thao tác: reviewDecks (theo deckId), addReviewDeck, removeReviewDeck. cần API: reviewDeck(deckId) trả thẻ mẫu (chỉ câu hỏi) và tiến độ riêng của bộ (đã học, nhớ tốt, cần ôn lại).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/45-review-deck.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: review/deck (Một bộ thẻ, chưa thêm; 1440 và 390); review/deck-added (Một bộ thẻ, đã thêm; chỉ 390); review/deck-adding (Một bộ thẻ, đang thêm; chỉ 390); review/deck-not-found (Một bộ thẻ, không tìm thấy; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Breadcrumbs, Section kind="figures", Section kind="list", SurfaceCard (thẻ mẫu), Button. cần Grammar: không có.
Hành động chính: chưa thêm "Thêm bộ thẻ này"; đã thêm "Ôn bộ này"; đang thêm thì xám kèm "Đang thêm…".
Lọc: không có.
Việc đổi: trang mới.
Xung đột: không.
