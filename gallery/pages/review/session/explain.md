---
title: Phiên ôn tập
route: /review/session
area: review
reviewed: 2026-11-17
---

Route: `/review/session` (ảnh chụp: không có thẻ đến hạn nên phiên rỗng; khi có thẻ, mỗi thẻ hiện câu hỏi, ô tự chấm và nút chấm). Mã: `fe/apps/app/src/components/blocks/ReviewSession/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn, tiêu đề "Phiên ôn tập" và bộ đếm "0/0"

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn "Về Ôn tập / Phiên ôn tập" (mục đầu về `review/hub`), tiêu đề 18/600 và dưới nó bộ đếm nhỏ "0/0" (thẻ đã ôn trên tổng). Bộ đếm nằm ở dải để không chiếm chỗ thân trang.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title, description }}` (`frame/Page/index.d.ts`).

## Thanh tiến độ

Vì sao: một thanh mảnh đặt giữa thân trang, rộng bằng cột nội dung (khoảng 540px), đầy dần theo số thẻ đã ôn; ở 0/0 nó trống.
Luật: `verify-against-visualize.md`.
Grammar: `Progress` (`composite/Progress`).

## Trạng thái "Không có mục nào để ôn" và nút "Về Ôn tập"

Vì sao: khi phiên không có thẻ, thân trang là ô icon hộp thư và một câu, kèm một nút trung tính "Về Ôn tập" (không phải nút chính vì việc duy nhất ở đây là quay lại). Khi có thẻ, vùng này là `ReviewItemCard` (câu hỏi, thẻ nhãn, ô tự chấm) rồi `ReviewSummaryCard` ở cuối phiên. CHƯA RÕ: ảnh chụp thiếu trạng thái có thẻ vì dữ liệu chụp không có thẻ đến hạn; nút "Về Ôn tập" lệch trái so với cột chữ căn giữa phía trên.
Luật: `grammar-slot-interface`, `verify-against-visualize.md`.
Grammar: `SlotView`, `EmptyNotice` (`composite/EmptyNotice`), `Button intent="neutral" href` (`leaf/Button`), `ReviewItemCard` và `ReviewSummaryCard` (`fe/packages/starci-next-ui/src/composites`).
