---
title: Bản chất / Bài học / Dự đoán
route: /essentials/[topic]/[lesson]?phase=predict
area: essentials
---

Route: `/essentials/[topic]/[lesson]?phase=predict`. Chụp bằng người học có Premium (cấp bằng `cli entitlement dev-grant`) nên thẻ của pha đã hiện; ảnh 1440 và 390 đã được đọc.

## Band (breadcrumbs có thêm pha, tiêu đề, chip, facts, câu mở đầu)

Vì sao: cùng band của tổng quan; breadcrumbs dài thêm một mục là tên pha ("Dự đoán", mục hiện tại, không link); câu mở đầu của pha là dòng mô tả 14 muted dưới tiêu đề, thay cho một câu lẻ nằm trong thẻ. Không có nút chính vì việc làm của pha nằm trong giếng.
Luật: `page-header-left-sublabel-xs.md`, `table-heroui-native-section-head.md` (câu lẻ không thành thẻ).
Grammar: `Page header { breadcrumbs, description, status, meta }` (`node_modules/@starci/grammar/dist/core/frame/PageHeader/index.d.ts`).

## Sáu pha là tab của trang (Tổng quan, Bị hỏi, Dự đoán, Thí nghiệm, Hiểu, Áp dụng, Phỏng vấn lại)

Vì sao: chọn tab trang kiểu link thay cho Stepper hoặc rail trong aside. Mỗi pha là một địa chỉ `?phase=` (link thật, mở tab mới được, nút Back chạy đúng); Stepper chỉ có `onStepSelect` (không có href); aside đã có ba mục khác nên thêm rail vào đó sẽ phình hoặc thành thẻ nổi. Tab "Tổng quan" đứng đầu để quay lại. Pha cần Premium có icon khoá outline trước nhãn. Tab hiện tại gạch chân.
Luật: `surfacecard-zones-api.md` (underline = tab chuyển view), lint `page-tabs-in-header` (tab trang nằm trong header).
Grammar: `Page header.tabs { label, items: TabItem { href, leading }, selectedKey }` (`branch/Tabs/index.d.ts`, `frame/PageHeader/index.d.ts`). Các phần trong một pha (nếu có) là `header.subTabs` (tab vùng của view hiện tại).

## Giếng giữa: nhãn "Dự đoán trước khi quan sát" + thẻ tình huống (MarkdownBody)

Vì sao: một thẻ trắng nổi chứa đoạn fixture (một nội dung), nhãn 14/500 đặt trên giếng; không có thẻ lồng.
Luật: `pink-page-surface-rule.md`, `table-heroui-native-section-head.md`.
Grammar: `MarkdownBody` (`fe/packages/starci-next-ui/src/composites/MarkdownBody/index.tsx`) trong `SurfaceCard label`; `Pane area="main" scroll`.

## Giếng giữa: nhãn câu hỏi "Trace nào phù hợp với request này?" + ChoiceCard

Vì sao: danh sách lựa chọn là một thẻ chọn, hàng có Checkbox (hình ô vuông dù chỉ chọn một), đường kẻ ngang hết chiều rộng; nút "Nộp đáp án" nằm trong chân thẻ (footer), vô hiệu tới khi chọn. Lời giải từng lựa chọn chỉ hiện sau khi chọn nên ảnh chụp chưa có. CHƯA RÕ: nút mang icon gửi ở cỡ md, luật chỉ cho icon ở CTA chính `intent="commit"`; lane S5 cần xác nhận intent (đúng nếu là commit, SAI nếu không).
Luật: `surfacecard-select-subtitle.md` (mọi danh sách chọn = SurfaceCard kind="select"), `surfacecard-zones-api.md` (footers).
Grammar: `ChoiceCard` (`fe/packages/starci-next-ui/src/composites/ChoiceCard/index.tsx`) = `SurfaceCard kind="select"` + footer `Button`.

## Aside phải (Kết quả học tập, Ôn tập, Tài liệu tham khảo)

Vì sao: các mục phẳng trên bề mặt trắng, có đường kẻ, không thẻ nổi. "Kết quả học tập" là một hàng cho mỗi kết quả: tên kết quả 14, dòng 12 muted nói trạng thái ("Chưa bắt đầu", "Đã hiểu", "Đã chứng minh bằng mã"), thanh nhỏ (RowProgress) chỉ hiện khi đã bắt đầu; hết ba thanh xám không tên. "Ôn tập" là hàng Sau 1/7/21 ngày + 12 muted; "Tài liệu tham khảo" là link primary có ↗. Dưới lg aside thành nút "Kết quả học tập" mở ngăn kéo thay vì các khối đầu giếng như luật: CHƯA RÕ (Grammar `Pane collapse="drawer"`, cần NIVO UX/UI xác nhận).
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll collapse="drawer"`, `Section`, `DescriptionList layout="stacked" isDivided`, `Link`; `StudyRail` (`fe/packages/starci-next-ui/src/composites/StudyRail/index.tsx`), `RowProgress`.
