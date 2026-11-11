---
title: Bản chất / Bài học / Thí nghiệm
route: /essentials/[topic]/[lesson]?phase=explore
area: essentials
---
Route: `/essentials/[topic]/[lesson]?phase=explore`. Chụp bằng người học có Premium (cấp bằng `cli entitlement dev-grant`) nên thẻ của pha đã hiện; ảnh 1440 và 390 đã được đọc.

## Band (breadcrumbs có thêm pha, tiêu đề, chip, facts, câu mở đầu)
Vì sao: cùng band của tổng quan; breadcrumbs dài thêm một mục là tên pha ("Thí nghiệm", mục hiện tại, không link); câu mở đầu của pha là dòng mô tả 14 muted dưới tiêu đề, thay cho một câu lẻ nằm trong thẻ. Không có nút chính vì việc làm của pha nằm trong giếng.
Luật: `page-header-left-sublabel-xs.md`, `table-heroui-native-section-head.md` (câu lẻ không thành thẻ).
Grammar: `Page header { breadcrumbs, description, status, meta }` (`node_modules/@starci/grammar/dist/core/frame/PageHeader/index.d.ts`).

## Sáu pha là tab của trang (Tổng quan, Bị hỏi, Dự đoán, Thí nghiệm, Hiểu, Áp dụng, Phỏng vấn lại)
Vì sao: chọn tab trang kiểu link thay cho Stepper hoặc rail trong aside. Mỗi pha là một địa chỉ `?phase=` (link thật, mở tab mới được, nút Back chạy đúng); Stepper chỉ có `onStepSelect` (không có href); aside đã có ba mục khác nên thêm rail vào đó sẽ phình hoặc thành thẻ nổi. Tab "Tổng quan" đứng đầu để quay lại. Pha cần Premium có icon khoá outline trước nhãn. Tab hiện tại gạch chân.
Luật: `surfacecard-zones-api.md` (underline = tab chuyển view), lint `page-tabs-in-header` (tab trang nằm trong header).
Grammar: `Page header.tabs { label, items: TabItem { href, leading }, selectedKey }` (`branch/Tabs/index.d.ts`, `frame/PageHeader/index.d.ts`). Các phần trong một pha (nếu có) là `header.subTabs` (tab vùng của view hiện tại).

## Giếng giữa: nhãn "Thử và quan sát" + thẻ mô phỏng (MarkdownBody)
Vì sao: một thẻ trắng nổi gồm đoạn hướng dẫn, sơ đồ cơ chế và MỘT chú thích (câu dẫn trùng chú thích đã bị `MarkdownBody` bỏ). CHƯA RÕ: sơ đồ vẫn có khung viền riêng vì `MermaidDiagram` tự vẽ khung canvas, Grammar không có biến thể không khung; cần NIVO UX/UI. SAI còn lại: nhãn nút và cạnh (Middleware, Guard, allow, deny...) là tiếng Anh vì nằm trong nguồn nội dung của thầy (`starci-lab/data`, nhánh origin/main, `concepts/0-request-response-lifecycle/sections/2-experiment/vi.md`, nhập vào seed `primary-lessons.sql`); không sửa trong component, cần thầy hoặc người giữ repo nội dung dịch.
Luật: `pink-page-surface-rule.md` (không thẻ trong thẻ), `flowgraph-card-style.md`.
Grammar: `MarkdownBody` (`fe/packages/starci-next-ui/src/composites/MarkdownBody/index.tsx`) -> `MermaidDiagram` (`node_modules/@starci/grammar/dist/core/frame/MermaidDiagram/index.d.ts`).

## Nhãn "Các trạng thái của mô phỏng" + danh sách trạng thái
Vì sao: một thẻ danh sách: hàng có tên (500), dòng 12 muted, chip "Hiện tại" (tím, việc đang làm), "Chưa tới" muted; chân thẻ có hai nút neutral sm dạng pill "Đổi principal sang admin", "Làm lại từ đầu" (không icon). SAI nhẹ: đoạn mô tả đầu thẻ là câu lẻ trong thẻ danh sách, luật chỉ cho khi là một hàng.
Luật: `suggestion-button-sm.md`, `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `SimulationCard` states = `SurfaceCard` list, footers `Button size="sm"` (`fe/packages/starci-next-ui/src/composites/SimulationCard/index.tsx`).

## Aside phải (Kết quả học tập, Ôn tập, Tài liệu tham khảo)
Vì sao: các mục phẳng trên bề mặt trắng, có đường kẻ, không thẻ nổi. "Kết quả học tập" là một hàng cho mỗi kết quả: tên kết quả 14, dòng 12 muted nói trạng thái ("Chưa bắt đầu", "Đã hiểu", "Đã chứng minh bằng mã"), thanh nhỏ (RowProgress) chỉ hiện khi đã bắt đầu; hết ba thanh xám không tên. "Ôn tập" là hàng Sau 1/7/21 ngày + 12 muted; "Tài liệu tham khảo" là link primary có ↗. "Kết quả học tập" và "Ôn tập" là `Section kind="list"` phẳng (Grammar 0.37.14), không còn `DescriptionList`. Dưới lg aside thành nút "Kết quả học tập" mở ngăn kéo thay vì các khối đầu giếng như luật: CHƯA RÕ (Grammar `Pane collapse="drawer"`, cần NIVO UX/UI xác nhận).
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll collapse="drawer"`, `Section`, `DescriptionList layout="stacked" isDivided`, `Link`; `StudyRail` (`fe/packages/starci-next-ui/src/composites/StudyRail/index.tsx`), `RowProgress`.
