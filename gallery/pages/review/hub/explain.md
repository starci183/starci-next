---
title: Ôn tập hôm nay
route: /review
area: review
reviewed: 2026-11-17
---

Route: `/review` (ảnh chụp: học viên mới, chưa có bộ thẻ hay bài Bản chất nào nên hôm nay không có gì đến hạn). Mã: `fe/apps/app/src/components/blocks/ReviewToday/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải tiêu đề "Ôn tập hôm nay"

Vì sao: dải trắng phẳng, viền dưới, sát trái: tiêu đề 18/600 và một dòng muted nói luật ôn (nhớ lại trước khi xem đáp án, thẻ tự chấm sẽ hẹn lần ôn kế tiếp). Trang không có nút ở dải vì lệnh chính nằm trong trạng thái rỗng của thẻ.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, description }}` (`frame/Page/index.d.ts`).

## Giếng chính "Hôm nay chưa có gì đến hạn"

Vì sao: nhãn khối trên một thẻ trắng nổi lớn. Khi không có thẻ đến hạn, thẻ là trạng thái rỗng có hình: tranh minh hoạ (`ART`), câu "Hôm nay chưa có gì đến hạn", dòng muted nói thêm một bộ thẻ hoặc học một bài Bản chất để câu hỏi ôn tự đến sau 1, 7 và 21 ngày, rồi hai nút: "Chọn bộ thẻ" (nút chính) và "Đến Bản chất" (trung tính). Khi có thẻ đến hạn, thẻ thay bằng số thẻ và nút chính "Bắt đầu ôn". CHƯA RÕ: hình và chữ căn giữa nhưng hai nút căn trái, nên nhóm chữ và nút lệch trục nhau.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md` (một nút chính mỗi vùng), `type-scale-14-12.md`.
Grammar: `SurfaceCard`, `ArtImage` và `ART` (`fe/packages/starci-next-ui/src/leaves/Art`), `Button intent="commit"` và `Button intent="neutral"` (`leaf/Button`); khung xương qua `SlotView`.

## Cột phụ "Thẻ đến từ đâu"

Vì sao: cột phụ nói nguồn của hàng ôn: hai dòng đếm "Bộ thẻ · 0" và "Bài Bản chất · 0", rồi một khối "Xem chuỗi ở trang Học" giải thích chuỗi ngày nằm ở trang Học và ôn xong mọi mục đến hạn trong ngày là một hành động có tính chuỗi, với liên kết sang trang Học. Cột nằm cạnh giếng ở lg, xếp xuống dưới ở hẹp hơn.
Luật: `pink-page-surface-rule.md` (cột phụ), `verify-against-visualize.md`.
Grammar: `Page layout="workspace"` có cột phụ (`frame/Page`), `SurfaceCard`, `Link` (`leaf/Link`), `UpsellRow` khi chưa có Premium.
