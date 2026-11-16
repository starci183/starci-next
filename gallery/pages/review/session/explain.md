---
title: Phiên ôn tập
route: /review/session
area: review
---

Route: `/review/session` (ảnh chụp: không có thẻ đến hạn nên phiên rỗng; khi có thẻ, mỗi thẻ hiện câu hỏi, ô tự chấm và nút chấm). Mã: `fe/apps/app/src/components/blocks/ReviewSession/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn, tiêu đề "Phiên ôn tập" và bộ đếm "0/0"

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn "Về Ôn tập / Phiên ôn tập" (mục đầu về `review/hub`), tiêu đề 18/600 và dưới nó bộ đếm nhỏ "0/0" (thẻ đã ôn trên tổng). Bộ đếm nằm ở dải để không chiếm chỗ thân trang.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title, description }}` (`frame/Page/index.d.ts`).

## Thanh tiến độ

Vì sao: một thanh mảnh xám nhạt đặt đầu thân trang, rộng bằng cột nội dung (khoảng 540px), đầy dần theo số thẻ đã ôn; ở 0/0 nó trống. Ở 390 nó chiếm trọn chiều rộng.
Luật: `theme-and-type` (tím chỉ là tín hiệu, thanh trống là xám).
Grammar: `Progress` (`composite/Progress`).

## Trạng thái "Không có mục nào để ôn" và nút "Về Ôn tập"

Vì sao: khi phiên không có thẻ, thân trang phẳng, không thẻ: ô icon hộp thư và một câu, kèm nút pill trung tính "Về Ôn tập" (không phải nút chính vì việc duy nhất ở đây là quay lại). Khi có thẻ, vùng này là `ReviewItemCard` (câu hỏi, ô tự chấm; thẻ vì là một câu hỏi thật) rồi `ReviewSummaryCard` ở cuối phiên. CHƯA RÕ: ảnh chụp thiếu trạng thái có thẻ vì dữ liệu chụp không có thẻ đến hạn; nút "Về Ôn tập" căn trái dưới ô icon và câu căn giữa, lệch trục.
Luật: `surface-layering` (trạng thái rỗng nằm trong vùng, một lệnh quay lại trung tính), `grammar-slot-interface`.
Grammar: `SlotView`, `Alert tone="informative"`, `Button intent="neutral" href` (`leaf/Button`), `ReviewItemCard` và `ReviewSummaryCard` (`fe/packages/starci-next-ui/src/composites`).
