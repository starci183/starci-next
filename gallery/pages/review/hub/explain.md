---
title: Ôn tập hôm nay
route: /review
area: review
reviewed: 2026-11-17
---

Route: `/review` (ảnh chụp: học viên mới, chưa có bộ thẻ hay bài Bản chất nào nên hôm nay không có gì đến hạn). Mã: `fe/apps/app/src/components/blocks/ReviewToday/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải tiêu đề "Ôn tập hôm nay"

Vì sao: dải trắng phẳng, viền dưới 1px, sát trái: tiêu đề 18/600 và một dòng muted nói luật ôn (nhớ lại trước khi xem đáp án, thẻ tự chấm sẽ hẹn lần ôn kế tiếp). Trang không có nút ở dải vì lệnh chính nằm trong trạng thái rỗng của vùng chính.
Luật: `surface-layering` (dải đầu trang sát trái), `theme-and-type`.
Grammar: `Page header={{ title, description }}` (`frame/Page/index.d.ts`).

## Vùng chính "Hôm nay chưa có gì đến hạn"

Vì sao: một `Section` phẳng trên nền trắng, không còn thẻ bao quanh. Khi không có thẻ đến hạn, thân Section là trạng thái rỗng có hình: tranh minh hoạ (`ART`), câu "Hôm nay chưa có gì đến hạn", dòng muted nói thêm một bộ thẻ hoặc học một bài Bản chất để câu hỏi ôn tự đến sau 1, 7 và 21 ngày, rồi hai nút pill: "Chọn bộ thẻ" (nút chính duy nhất của màn, tím) và "Đến Bản chất" (trung tính, viền mảnh). Khi có thẻ đến hạn, thân Section thay bằng số thẻ và nút chính "Bắt đầu ôn". CHƯA RÕ: hình và chữ căn giữa nhưng hai nút căn trái, nên nhóm chữ và nút lệch trục nhau; ở 1920 vùng chính còn bị co vào giữa nên lệch với dải tiêu đề sát trái.
Luật: `surface-layering` (một nút chính mỗi màn, Section thay thẻ), `theme-and-type` (tím chỉ là tín hiệu).
Grammar: `Section`, `ArtImage` và `ART` (`fe/packages/starci-next-ui/src/leaves/Art`), `Button intent="commit"` và `Button intent="alternative"` (`leaf/Button`); khung xương qua `SlotView`.

## Cột phụ "Thẻ đến từ đâu"

Vì sao: cột phụ phẳng, không thẻ, đầu mục là `Section`: hai dòng đếm "Bộ thẻ · 0" và "Bài Bản chất · 0", rồi mục "Xem chuỗi ở trang Học" giải thích chuỗi ngày nằm ở trang Học và ôn xong mọi mục đến hạn trong ngày là một hành động có tính chuỗi, kèm liên kết sang trang Học. Cột nằm cạnh vùng chính ở lg, xếp xuống dưới ở hẹp hơn (ảnh 390). SAI: tiêu đề mục và liên kết cùng một chữ "Xem chuỗi ở trang Học" nên lặp nhau, và liên kết không có mũi tên "→" theo luật liên kết.
Luật: `surface-layering` (cột phụ không làm bằng thẻ, liên kết kết thúc bằng mũi tên).
Grammar: `Page layout="main-rail"` có cột phụ (`frame/Page`), `Section`, `Link variant="plain"` (`leaf/Link`), `UpsellRow` khi chưa có Premium.

## Phản biện

- 1440: vùng chính "Hôm nay chưa có gì đến hạn": tranh, tiêu đề và dòng mô tả căn giữa nhưng hai nút "Chọn bộ thẻ" và "Đến Bản chất" căn trái dưới cùng cột; nhóm chữ và nút lệch trục.
- 1440: tiêu đề Section "Hôm nay chưa có gì đến hạn" lặp y nguyên với câu bên dưới tranh; một trạng thái nói hai lần.
- 1440: cột phụ có tiêu đề "Xem chuỗi ở trang Học" và liên kết cuối cột cũng "Xem chuỗi ở trang Học"; lặp chữ, liên kết không có mũi tên "→" và nhìn như một tiêu đề đậm chứ không phải liên kết.
- 1440: dòng mô tả dưới tranh và các đoạn muted ngả nâu đỏ nhạt thay vì xám trung tính (luật neutral chroma 0); tương phản chữ muted thấp trên nền trắng.
- 1440: nút chính "Chọn bộ thẻ" nền tím nhạt, chữ đen; tương phản chữ trên nút thấp.
- 1440: nửa dưới trang trống; dải đầu trang cao hơn nội dung cần.
- 1920: vùng chính và cột phụ bị co vào giữa (bắt đầu ở x=480) trong khi dải tiêu đề sát trái ở x=288; hai trục trái lệch nhau. Các lỗi căn giữa/căn trái, tiêu đề lặp, liên kết lặp không mũi tên và chữ muted ngả nâu giữ nguyên.
- 390: cột phụ xuống dưới nút; "Xem chuỗi ở trang Học" vẫn lặp hai lần, liên kết cuối không có mũi tên; câu mô tả bị bẻ để "ngày." đứng một mình ở dòng cuối (từ mồ côi); tranh nhỏ và hai nút căn trái trong khi chữ căn giữa, lệch trục.
