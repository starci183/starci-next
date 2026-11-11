---
title: Bản chất / Bài học / Hiểu
route: /essentials/[topic]/[lesson]?phase=explain
area: essentials
---
Route: `/essentials/[topic]/[lesson]?phase=explain`. Chụp bằng người học có Premium (cấp bằng `cli entitlement dev-grant`) nên thẻ của pha đã hiện; ảnh 1440 và 390 đã được đọc.

## Band (breadcrumbs có thêm pha, tiêu đề, chip, facts, câu mở đầu)
Vì sao: cùng band của tổng quan; breadcrumbs dài thêm một mục là tên pha ("Hiểu", mục hiện tại, không link); câu mở đầu của pha là dòng mô tả 14 muted dưới tiêu đề, thay cho một câu lẻ nằm trong thẻ. Không có nút chính vì việc làm của pha nằm trong giếng.
Luật: `page-header-left-sublabel-xs.md`, `table-heroui-native-section-head.md` (câu lẻ không thành thẻ).
Grammar: `Page header { breadcrumbs, description, status, meta }` (`node_modules/@starci/grammar/dist/core/frame/PageHeader/index.d.ts`).

## Sáu pha là tab của trang (Tổng quan, Bị hỏi, Dự đoán, Thí nghiệm, Hiểu, Áp dụng, Phỏng vấn lại)
Vì sao: chọn tab trang kiểu link thay cho Stepper hoặc rail trong aside. Mỗi pha là một địa chỉ `?phase=` (link thật, mở tab mới được, nút Back chạy đúng); Stepper chỉ có `onStepSelect` (không có href); aside đã có ba mục khác nên thêm rail vào đó sẽ phình hoặc thành thẻ nổi. Tab "Tổng quan" đứng đầu để quay lại. Pha cần Premium có icon khoá outline trước nhãn. Tab hiện tại gạch chân.
Luật: `surfacecard-zones-api.md` (underline = tab chuyển view), lint `page-tabs-in-header` (tab trang nằm trong header).
Grammar: `Page header.tabs { label, items: TabItem { href, leading }, selectedKey }` (`branch/Tabs/index.d.ts`, `frame/PageHeader/index.d.ts`). Các phần trong một pha (nếu có) là `header.subTabs` (tab vùng của view hiện tại).

## Hàng tab con (Một pipeline có ba đường, Chọn tầng bằng context cần dùng, Hai interceptor là hai lớp bao, Đọc mô hình rồi tìm bằng chứng)
Vì sao: các phần lý thuyết là tab gạch chân thứ hai dưới tab pha, chọn một phần mỗi lần, tab đầu mở sẵn; chỉ phần đầu được chụp.
Luật: `surfacecard-zones-api.md` (underline = tab phụ chuyển view).
Grammar: `Page header.subTabs` (`node_modules/@starci/grammar/dist/core/frame/PageHeader/index.d.ts`).

## Giếng giữa: nhãn theo tên phần + thẻ nội dung (MarkdownBody)
Vì sao: một thẻ trắng nổi chứa ba đoạn lý thuyết (một nội dung), nhãn trên giếng trùng tên tab con; đúng luật. CHƯA RÕ: ba đoạn dài không có tiêu đề nhỏ nên khó quét, có nên tách thành hàng hay không.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md` (cả đoạn 14).
Grammar: `MarkdownBody` (`fe/packages/starci-next-ui/src/composites/MarkdownBody/index.tsx`) trong `SurfaceCard label`.

## Aside phải (Kết quả học tập, Ôn tập, Tài liệu tham khảo)
Vì sao: các mục phẳng trên bề mặt trắng, có đường kẻ, không thẻ nổi. "Kết quả học tập" là một hàng cho mỗi kết quả: tên kết quả 14, dòng 12 muted nói trạng thái ("Chưa bắt đầu", "Đã hiểu", "Đã chứng minh bằng mã"), thanh nhỏ (RowProgress) chỉ hiện khi đã bắt đầu; hết ba thanh xám không tên. "Ôn tập" là hàng Sau 1/7/21 ngày + 12 muted; "Tài liệu tham khảo" là link primary có ↗. Dưới lg aside thành nút "Kết quả học tập" mở ngăn kéo thay vì các khối đầu giếng như luật: CHƯA RÕ (Grammar `Pane collapse="drawer"`, cần NIVO UX/UI xác nhận).
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll collapse="drawer"`, `Section`, `DescriptionList layout="stacked" isDivided`, `Link`; `StudyRail` (`fe/packages/starci-next-ui/src/composites/StudyRail/index.tsx`), `RowProgress`.
