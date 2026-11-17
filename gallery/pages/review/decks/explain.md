---
title: Bộ thẻ ôn tập
route: /review/decks
area: review
reviewed: 2026-11-17
---

Route: `/review/decks` (ảnh chụp: học viên chưa có Premium, chưa thêm bộ thẻ nào). Mã: `fe/apps/app/src/components/blocks/ReviewDecks/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Về Ôn tập / Bộ thẻ ôn tập", tiêu đề và mô tả

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn hai mục (mục đầu quay về `review/hub`), tiêu đề 18/600 và dòng muted nói chọn bộ thẻ muốn ôn, bộ đã thêm vào hàng đợi mỗi ngày, tối đa bằng mục tiêu của bạn.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title, description }}` (`frame/Page/index.d.ts`).

## Cột trái "Lọc theo lộ trình"

Vì sao: một thẻ bộ lọc: nhãn nhóm "Lộ trình" với các chip chọn (Tất cả, Kỹ sư AI, Backend fullstack, Founder, System design senior), nhãn "Khoá" và ô chọn "Mọi khoá". Chip đang chọn nền accent nhạt, chip còn lại xám. CHƯA RÕ: dưới thẻ lọc có một chữ "Về Ôn tập" đứng riêng không rõ là liên kết hay nhãn (nó lặp mục đầu của đường dẫn); nên bỏ.
Luật: `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `SurfaceCard`, `ChipGroup`/`Badge` chọn và `Select` (`composite/Select`); code `ReviewDecks/component.tsx`.

## Danh sách thẻ bộ

Vì sao: mỗi bộ là một thẻ: tên đậm, chip độ khó bên phải (hard đỏ nhạt, medium vàng), một đoạn mô tả cắt bằng "…" sau ba dòng, dòng chip "20 thẻ", "3 thẻ miễn phí", "Một phần cần Premium" và một nút chính "Thêm" (thêm vào hàng đợi hằng ngày). Mười lăm thẻ, mỗi thẻ có nút tím nên cả trang chỉ có nút chính lặp lại theo hàng. CHƯA RÕ: lặp nút chính mười lăm lần trái với "một nút chính mỗi vùng"; nên là nút trung tính cỡ sm và chỉ giữ tím cho lệnh của cả trang.
Luật: `verify-against-visualize.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard`, `Badge`, `Button intent="commit"` (`leaf/Button`); thẻ bộ dựng trong `ReviewDecks/component.tsx`.

## Khối "Mục tiêu mỗi ngày"

Vì sao: cuối trang, nhãn khối trên một thẻ: ô số "Số thẻ mỗi ngày" có nút trừ và cộng (giá trị 10), dòng muted nói từ 5 đến 50 thẻ và nút chính "Lưu mục tiêu". Ô số có nút bấm vì học viên chỉnh nhanh từng bước.
Luật: `verify-against-visualize.md`, `type-scale-14-12.md`.
Grammar: `NumberField` (`composite/NumberField`), `Button intent="commit"`.
