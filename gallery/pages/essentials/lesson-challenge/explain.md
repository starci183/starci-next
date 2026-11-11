---
title: Bản chất / Bài học / Bị hỏi
route: /essentials/[topic]/[lesson]?phase=challenge
area: essentials
---
Route: `/essentials/[topic]/[lesson]?phase=challenge`. Chụp bằng người học có Premium (cấp bằng `cli entitlement dev-grant`) nên thẻ của pha đã hiện; ảnh 1440 và 390 đã được đọc.

## Band (breadcrumbs có thêm pha, tiêu đề, chip, facts, câu mở đầu)
Vì sao: cùng band của tổng quan; breadcrumbs dài thêm một mục là tên pha ("Bị hỏi", mục hiện tại, không link); câu mở đầu của pha là dòng mô tả 14 muted dưới tiêu đề, thay cho một câu lẻ nằm trong thẻ. Không có nút chính vì việc làm của pha nằm trong giếng.
Luật: `page-header-left-sublabel-xs.md`, `table-heroui-native-section-head.md` (câu lẻ không thành thẻ).
Grammar: `Page header { breadcrumbs, description, status, meta }` (`node_modules/@starci/grammar/dist/core/frame/PageHeader/index.d.ts`).

## Sáu pha là tab của trang (Tổng quan, Bị hỏi, Dự đoán, Thí nghiệm, Hiểu, Áp dụng, Phỏng vấn lại)
Vì sao: chọn tab trang kiểu link thay cho Stepper hoặc rail trong aside. Mỗi pha là một địa chỉ `?phase=` (link thật, mở tab mới được, nút Back chạy đúng); Stepper chỉ có `onStepSelect` (không có href); aside đã có ba mục khác nên thêm rail vào đó sẽ phình hoặc thành thẻ nổi. Tab "Tổng quan" đứng đầu để quay lại. Pha cần Premium có icon khoá outline trước nhãn. Tab hiện tại gạch chân.
Luật: `surfacecard-zones-api.md` (underline = tab chuyển view), lint `page-tabs-in-header` (tab trang nằm trong header).
Grammar: `Page header.tabs { label, items: TabItem { href, leading }, selectedKey }` (`branch/Tabs/index.d.ts`, `frame/PageHeader/index.d.ts`). Các phần trong một pha (nếu có) là `header.subTabs` (tab vùng của view hiện tại).

## Giếng giữa: nhãn "Bối cảnh phỏng vấn" + thẻ bối cảnh (MarkdownBody)
Vì sao: một thẻ trắng nổi, hai đoạn văn của câu hỏi; nhãn trên giếng.
Luật: `pink-page-surface-rule.md`.
Grammar: `MarkdownBody` (`fe/packages/starci-next-ui/src/composites/MarkdownBody/index.tsx`).

## Dải "Chẩn đoán đầu vào" (đã bỏ)
Vì sao: câu lẻ trong dải tím ngoài thẻ lặp lại điều band đã nói ("Đây là lần chẩn đoán đầu vào, chưa tính đạt") nên bị xoá khỏi `WrittenCard`; band là nơi duy nhất nói điều này.
Luật: `table-heroui-native-section-head.md` (câu lẻ không thành thẻ).
Grammar: `Page header.description`.

## Nhãn "Chấm theo" + danh sách tiêu chí
Vì sao: một thẻ danh sách các tiêu chí rubric (danh từ), nhãn 14/500 trên giếng. Chip đếm đã bỏ: ở 390 nhãn trong đầu thẻ bị cắt và chip rơi xuống dòng (lỗi đầu thẻ của Grammar khi có `count`), mà ba hàng tiêu chí đã tự đếm được; ghi vào "Grammar needs".
Luật: `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard kind="list" label` trong `WrittenCard` (`fe/packages/starci-next-ui/src/composites/WrittenCard/index.tsx`).

## Thẻ câu trả lời (câu hỏi, ô nhập, nút "Nộp câu trả lời")
Vì sao: MỘT thẻ cho một việc nộp bài: câu hỏi (500) rồi ô nhập, câu hỏi không lặp lại dưới ô (mô tả chỉ hiện khi hướng dẫn khác câu hỏi); chân thẻ là nút chính "Nộp câu trả lời" có icon gửi, cỡ md, `intent="commit"` (CTA chính duy nhất của thẻ). Trạng thái chấm hiện trong thân thẻ; bảng điểm là thẻ danh sách riêng sau khi có điểm.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md`.
Grammar: `SurfaceCard { ariaLabel, footers: [{ kind: "custom" }] }`, `Textarea`, `Button intent="commit" startGlyph="send"` (`fe/packages/starci-next-ui/src/composites/WrittenCard/index.tsx`).

## Aside phải (Kết quả học tập, Ôn tập, Tài liệu tham khảo)
Vì sao: các mục phẳng trên bề mặt trắng, có đường kẻ, không thẻ nổi. "Kết quả học tập" là một hàng cho mỗi kết quả: tên kết quả 14, dòng 12 muted nói trạng thái ("Chưa bắt đầu", "Đã hiểu", "Đã chứng minh bằng mã"), thanh nhỏ (RowProgress) chỉ hiện khi đã bắt đầu; hết ba thanh xám không tên. "Ôn tập" là hàng Sau 1/7/21 ngày + 12 muted; "Tài liệu tham khảo" là link primary có ↗. Dưới lg aside thành nút "Kết quả học tập" mở ngăn kéo thay vì các khối đầu giếng như luật: CHƯA RÕ (Grammar `Pane collapse="drawer"`, cần NIVO UX/UI xác nhận).
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll collapse="drawer"`, `Section`, `DescriptionList layout="stacked" isDivided`, `Link`; `StudyRail` (`fe/packages/starci-next-ui/src/composites/StudyRail/index.tsx`), `RowProgress`.
