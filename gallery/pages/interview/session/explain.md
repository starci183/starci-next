---
title: Phòng phỏng vấn (một buổi đang làm)
route: /interview/[sessionId]
area: interview
reviewed: 2026-11-17
---

Route: `/interview/[sessionId]` (ảnh chụp: câu 1/5 đang hỏi, học viên chưa gõ gì). Mã: `fe/apps/app/src/components/blocks/InterviewRoom/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn và tiêu đề "Buổi phỏng vấn"

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn "Về trang phỏng vấn / Buổi phỏng vấn" (mục đầu là liên kết quay lại `interview/start`, mục cuối là trang hiện tại, đậm) và tiêu đề 18/600. Trang con có đường dẫn trong dải.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Thanh trạng thái buổi: "Câu 1/5", "Cấp Junior" và nút "Kết thúc phỏng vấn"

Vì sao: một hàng trên cùng của cột chính: chip "Câu 1/5" (nền tím nhạt, chữ tím), chữ muted "Cấp Junior" và bên phải nút pill trung tính "Kết thúc phỏng vấn" (không phải nút chính vì kết thúc là việc hiếm; bấm mở hộp xác nhận "Tiếp tục làm" hoặc "Bỏ buổi này, không chấm"). CHƯA RÕ: chip "Câu 1/5" dùng tím cho một nhãn trạng thái, trái luật tím chỉ là tín hiệu; "Kết thúc phỏng vấn" là xám đặc còn "Gợi ý" viền mảnh, hai kiểu nút trung tính trong cùng màn.
Luật: `theme-and-type` (tím chỉ là tín hiệu), `surface-layering` (nút chính duy nhất là "Gửi").
Grammar: `Badge tone="accent"` và `Badge tone="muted"`, `Button intent="alternative"`, `AlertDialog` (`frame/AlertDialog`).

## Cuộc trò chuyện: câu hỏi hiện tại

Vì sao: ảnh chỉ có một bong bóng xám nhạt của "Thầy StarCi AI · người phỏng vấn · Câu 1" (đề bài). Khi học viên đã trả lời, câu trả lời (phải, nhãn "Bạn") và câu hỏi thêm của AI (nhãn "Hỏi thêm") hiện thêm; buổi không có nhận xét giữa chừng nên không bong bóng nào chấm điểm. Bong bóng là chỗ duy nhất còn nền xám nhạt vì là lời nói chứ không phải một vùng bố cục. CHƯA RÕ: ảnh không có câu trả lời hay câu hỏi thêm; chưa có thành phần chat chung nên bong bóng còn dựng riêng.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `InterviewChat` (`fe/packages/starci-next-ui/src/composites/InterviewChat`) với `bubbles`, `Text`, `Badge`; câu hỏi dựng bằng `MarkdownBlock` trong `InterviewRoom/component.tsx`.

## Tài liệu đề bài (sơ đồ)

Vì sao: không có trong ảnh vì câu 1 không kèm sơ đồ hay mã. Khi câu hỏi có tài liệu, sơ đồ (hình do bộ câu hỏi cung cấp) nằm phẳng dưới đề bài trong một `Section`, không còn khung thẻ trong thẻ. CHƯA RÕ: chưa có ảnh của câu có sơ đồ nên chưa xác nhận bằng mắt.
Luật: `surface-layering` (không thẻ trong thẻ).
Grammar: `Section`, `InterviewQuestionCard` (`fe/packages/starci-next-ui/src/composites/InterviewQuestionCard`).

## Khối "Câu trả lời của bạn" và các lệnh

Vì sao: một `Section` phẳng với đầu mục "Câu trả lời của bạn" (chỉ một nhãn, không lặp ở ô nhập), ô nhập nhiều dòng trắng viền 1px (gợi ý "Viết câu trả lời như khi nói với người phỏng vấn…") và hàng lệnh pill: "Gửi" là nút chính duy nhất của màn (nhạt khi chưa có chữ hoặc AI đang xử lý), "Gợi ý (2)" và "Bỏ qua câu này" trung tính, rồi dòng muted "Mỗi gợi ý trừ một chút điểm của câu này." (ở 390 dòng này xuống dưới các nút). Dòng cuối nói thẳng cái giá của gợi ý để học viên quyết định.
Luật: `surface-layering` (form là Section, một nút chính), `theme-and-type`.
Grammar: `InterviewComposer` (`fe/packages/starci-next-ui/src/composites/InterviewComposer`) gồm `Section`, `Textarea` (`composite/Textarea`), `Button intent="commit"` và `Button` neutral.

## Cột phải "Tiến độ" và "Buổi phỏng vấn"

Vì sao: cột phụ phẳng, không thẻ, mỗi mục là một `Section`: "Tiến độ" là năm bước đánh số (Câu 1 "Đang hỏi" với vòng tím nhạt, Câu 2 đến Câu 5 "Chưa tới" với vòng xám); "Buổi phỏng vấn" là một câu muted nhắc luật (không nhận xét giữa buổi, không tra nội dung bài, chấm một lượt khi kết thúc). Dưới lg cột này xếp xuống dưới cột chính.
Luật: `surface-layering` (cột phụ không làm bằng thẻ), `theme-and-type`.
Grammar: `Page layout="main-rail"` có cột phụ (`frame/Page`), `Section`, `StatusDot`.
