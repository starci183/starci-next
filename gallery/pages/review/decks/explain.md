---
title: Bộ thẻ ôn tập
route: /review/decks
area: review
reviewed: 2026-11-17
---

Route: `/review/decks` (ảnh chụp: học viên chưa thêm bộ thẻ nào, 15 bộ trong danh mục). Mã: `fe/apps/app/src/components/blocks/ReviewDecks/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Về Ôn tập / Bộ thẻ ôn tập", tiêu đề và mô tả

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn hai mục (mục đầu quay về `review/hub`), tiêu đề 18/600 và dòng muted nói chọn bộ thẻ muốn ôn, bộ đã thêm vào hàng đợi mỗi ngày, tối đa bằng mục tiêu của bạn. Đường dẫn là lối quay về duy nhất: không còn nhãn "Về Ôn tập" rơi riêng dưới bộ lọc.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title, description }}` (`frame/Page/index.d.ts`).

## Cột trái "Lọc theo lộ trình"

Vì sao: cột phụ phẳng, không thẻ: một `Section` có nhóm "Lộ trình" với các chip chọn (Tất cả, Kỹ sư AI, Backend fullstack, Founder, System design senior) và nhãn "Khoá" với ô chọn "Mọi khoá". Chip đang chọn xám có viền (tím không đánh dấu lựa chọn); ô chọn trắng viền 1px. Ở lg cột nằm bên trái; ở 390 cột xuống cuối trang, sau "Mục tiêu mỗi ngày", nên bộ lọc đến sau cả danh sách mà nó lọc.
Luật: `surface-layering` (cột phụ không làm bằng thẻ), `theme-and-type` (chọn là xám, ô trắng viền 1px).
Grammar: `Section` (`Rail` trong `ReviewDecks/component.tsx`), `ChipGroup`/`Badge` chọn, `Select` (`composite/Select`).

## Danh sách thẻ bộ

Vì sao: mỗi bộ là một vật thật nên vẫn là một thẻ (viền mảnh, không bóng): tên đậm, chip độ khó bên phải (hard đỏ nhạt, medium vàng), một đoạn mô tả cắt bằng "…" sau ba dòng, dòng chip "20 thẻ", "3 thẻ miễn phí", "Một phần cần Premium" và một nút "Thêm" trung tính cỡ nhỏ, chữ thuần không icon (thêm vào hàng đợi hằng ngày). Mười lăm thẻ lặp một nút nhỏ trung tính, nên tím chỉ còn ở lệnh của cả trang ("Lưu mục tiêu"). Ở 390 thẻ chiếm trọn chiều rộng và mô tả cắt sau hai dòng.
Luật: `surface-layering` (thẻ chỉ cho vật thật; lệnh lặp theo hàng là nút trung tính nhỏ).
Grammar: `SurfaceCard`, `Badge`, `Button` neutral cỡ sm (`leaf/Button`); thẻ bộ dựng trong `ReviewDecks/component.tsx`.

## Khối "Mục tiêu mỗi ngày"

Vì sao: cuối trang, một `Section` phẳng: ô số "Số thẻ mỗi ngày" trắng viền 1px có nút trừ và cộng (giá trị 10), dòng muted nói từ 5 đến 50 thẻ và nút chính pill "Lưu mục tiêu", nút chính duy nhất của màn. Ô số có nút bấm vì học viên chỉnh nhanh từng bước.
Luật: `surface-layering` (form là Section, một nút chính), `theme-and-type`.
Grammar: `Section`, `NumberField` (`composite/NumberField`), `Button intent="commit"`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: chip độ khó "hard" nền đỏ nhạt chữ đỏ, "medium" nền vàng nhạt, "Một phần cần Premium" nền vàng nhạt: nền tô màu lặp mười lăm lần thành các mảng màu, trái luật cặp soft trung tính; lại hiện "Một phần cần Premium" và "2 thẻ miễn phí" cho học viên đã Premium nên sai trạng thái.
- 1440: mười lăm thẻ giống nhau xếp dọc, mỗi thẻ một nút "Thêm" lẻ loi dưới cùng bên trái, chừa trống nửa phải của thẻ.
- 1440: mô tả bộ thẻ cắt bằng "…" giữa câu (Module 1, Thiết kế API, Caching...) nên mất ý; chữ mô tả muted ngả nâu.
- 1440: chip chọn "Tất cả" nền xám có viền đậm hơn các chip khác, nhìn như nút nhấn.
- 1440: đầu mục "Lọc theo lộ trình" và "Mục tiêu mỗi ngày" cùng cỡ với nhãn nhóm "Lộ trình", "Khoá", phân cấp mờ; cột lọc có khoảng trống rất dài bên dưới.
- 1440: nút "Lưu mục tiêu": ô số rộng hết cột nên nút trừ cộng ở hai mép xa nhau.
- 390: bộ lọc rơi xuống cuối trang, sau cả mười lăm thẻ và "Mục tiêu mỗi ngày", nên lọc đến sau thứ nó lọc.
- 390: mô tả thẻ cắt sau hai dòng bằng "…"; nút "Thêm" nằm dòng riêng nên thẻ cao, trang dài khoảng 3900px; chip độ khó sát tên bộ ở mép phải thẻ.
