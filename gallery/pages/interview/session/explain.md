---
title: Phòng phỏng vấn (một buổi đang làm)
route: /interview/[sessionId]
area: interview
---

Route: `/interview/[sessionId]` (ảnh chụp: câu 1 đã trả lời, AI hỏi thêm một câu, học viên chưa trả lời câu hỏi thêm). Mã: `fe/apps/app/src/components/blocks/InterviewRoom/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn và tiêu đề "Buổi phỏng vấn"

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn "Về trang phỏng vấn / Buổi phỏng vấn" (mục đầu là liên kết quay lại `interview/start`, mục cuối là trang hiện tại, đậm) và tiêu đề 18/600. Trang con nên có đường dẫn trong dải chứ không phải liên kết rời.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Thanh trạng thái buổi: "Câu 1/3", "Cấp Junior" và nút "Kết thúc phỏng vấn"

Vì sao: một hàng trên cùng của cột chính: chip accent "Câu 1/3", chip xám cấp độ và bên phải nút trung tính "Kết thúc phỏng vấn" (không phải nút chính vì kết thúc là việc hiếm; bấm mở hộp xác nhận "Tiếp tục làm" hoặc "Bỏ buổi này, không chấm").
Luật: `table-heroui-native-section-head.md` (chip), `verify-against-visualize.md` (nút chính duy nhất là "Gửi").
Grammar: `Badge`, `Button intent="neutral"`, `AlertDialog` (`frame/AlertDialog`).

## Cuộc trò chuyện: câu hỏi, câu trả lời, câu hỏi thêm

Vì sao: ba bong bóng: câu hỏi của "Thầy StarCi AI · người phỏng vấn · Câu 1" (nền trắng, trái), câu trả lời của học viên (nền accent, phải, nhãn "Bạn") và câu hỏi thêm của AI có nhãn "Hỏi thêm". Buổi không có nhận xét giữa chừng nên không bong bóng nào chấm điểm. Mã lỗi nằm trong khối chữ cùng bong bóng đề bài.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: các bong bóng tự dựng trong `InterviewRoom/component.tsx` từ `Text` và `Badge`. CHƯA RÕ: chưa có thành phần chat của Grammar; nên là một thành phần dùng lại thay vì dựng tại chỗ.

## Khối "Code đề bài" (sơ đồ)

Vì sao: đề bài có sơ đồ nên hiện trong một thẻ lớn với sơ đồ module (CheckoutModule imports WalletModule, WalletService không exports). Sơ đồ là hình do bộ câu hỏi cung cấp, vẽ trong khung bo có viền; nhãn "Code đề bài" trên thẻ.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ).
Grammar: `SurfaceCard label` chứa sơ đồ (`InterviewRoom/component.tsx`). CHƯA RÕ: sơ đồ có chữ nhỏ và đường đứt đè lên nhãn "constructor inject — KHÔNG resolve được"; khung sơ đồ có nền trắng viền riêng bên trong thẻ trắng (thẻ trong thẻ).

## Khối "Câu trả lời của bạn" và các lệnh

Vì sao: nhãn khối trên thẻ có ô nhập nhiều dòng (khung xám, gợi ý "Viết câu trả lời như khi nói với người phỏng vấn…") và hàng lệnh: "Gửi" là nút chính (mờ khi chưa có chữ hoặc AI đang xử lý), "Gợi ý (2)" và "Bỏ qua câu này" trung tính, cuối là dòng muted "Mỗi gợi ý trừ một chút điểm của câu này". Dòng cuối nói thẳng cái giá của gợi ý để học viên quyết định.
Luật: `verify-against-visualize.md`, `type-scale-14-12.md`.
Grammar: `Textarea` (`composite/Textarea`), `Button intent="commit"`, `Button intent="neutral"`. CHƯA RÕ: nhãn "Câu trả lời của bạn" lặp hai lần (nhãn khối và nhãn ô nhập).

## Cột phải "Tiến độ" và "Buổi phỏng vấn"

Vì sao: cột phụ: "Tiến độ" là ba bước đánh số (Câu 1 đã trả lời, Câu 2 và Câu 3 chưa tới) với vòng tròn trạng thái xanh khi xong; "Buổi phỏng vấn" là một câu nền accent nhắc luật (không nhận xét giữa buổi, không tra nội dung bài, chấm một lượt khi kết thúc). Dưới lg cột này xếp xuống dưới cột chính.
Luật: `pink-page-surface-rule.md` (cột phụ là phần có đường kẻ), `type-scale-14-12.md`.
Grammar: `Page layout="workspace"` có cột phụ (`frame/Page`), `StatusDot`.
