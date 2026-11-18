---
title: Essentials (chủ đề)
route: /essentials/[topic]
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]`. Một chủ đề: các bài theo thứ tự nên học và còn bao nhiêu bài là xong. Ảnh ở 1440, 1920 và 390. Bản vẽ được duyệt: `design/starci-next/pages/02-essentials.html` (essentials-topic). Code: `fe/apps/app/src/components/blocks/TopicDetail/component.tsx`, mapper `fe/apps/app/src/hooks/topic/topic.shared.ts`, composite `LessonList`. Trạng thái có thư mục riêng: `topic-first-visit`, `topic-free`, `topic-loading`.

## Dải đầu: breadcrumb, tên, mô tả, dòng sự kiện, nút chính

Vì sao: có breadcrumb "Essentials › <chủ đề>" vì đây là trang con; dưới tên là câu mô tả của chủ đề rồi dòng muted "6 bài · khoảng 135 phút đọc". Nút chính "Học tiếp: <bài> · phần N" (lần đầu "Bắt đầu bài 1", tài khoản miễn phí "Học tiếp phần 1"). Ở 390 nút xuống dưới và rộng cả hàng.
Luật: ui/components/page-header (breadcrumbs, description, meta, actions), ui/components/button.
Grammar: `Page header { breadcrumbs, title, description, meta, actions }`.

## Thanh "2/6 bài xong"

Vì sao: một thanh màu chữ (đo lường không dùng tím) kèm "2/6 bài xong" và phần trăm; số bài xong đếm đúng số hàng "Đã xong" bên dưới.
Luật: `theme-and-type` (đo lường dùng foreground).
Grammar: `Progress label value valueText tone="foreground"`.

## Danh sách bài: số, tên, bài toán, 4 vạch, nhãn, "Mở bài 3/5", thời lượng

Vì sao: một danh sách phẳng đánh số; mỗi hàng có tên, một dòng bài toán, bốn vạch cho bốn phần, nhãn trạng thái, điểm mở bài (số câu đúng trong 5 câu mở bài, "—" khi chưa làm) và số phút. Hàng bài đang học tô xám nhẹ.
Luật: ui/components/list-table, `surface-layering`.
Grammar: `Section kind="list" items[ListRow { leading.position, detail: Meter segments={4}, badges, value, meta, state: "informative" }]` (`composites/LessonList`).

## Cột phải (chỉ 1440): mỗi bài có 4 phần, nên biết trước, liên quan

Vì sao: hiện từ khổ rộng. "Mỗi bài có 4 phần" liệt kê Bản chất (miễn phí), Source, Kịch bản, Tự áp dụng; ba phần sau mờ nếu chưa có Premium, kèm dòng "Phần 2 đến 4 cần Premium". "Nên biết trước" lấy từ điều kiện của chủ đề, "Chủ đề liên quan" là các liên kết chữ. Khối "Chủ đề này dạy" của bản vẽ chưa có dữ liệu (xem Phản biện).
Luật: ui/components/pane-grid (cột phụ ẩn ở khổ hẹp), `surface-layering` (aside là section có hairline, không thẻ).
Grammar: `PaneGrid areas={{ base: ["main"], wide: ["main aside"] }}`, `Pane area="aside" surface`, `PaneSection rule="start"`, `Section kind="list"`.

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc 1440 và 390 với dữ liệu mẫu qua core giả (xem catalog).
- Header của Grammar đặt dòng sự kiện (meta) trên câu mô tả; bản vẽ đặt mô tả trước, sự kiện sau.
- Nút chính nằm ở cuối hàng tiêu đề, trải qua cột phải ở 1440; bản vẽ cho cột phải bắt đầu dưới dải đầu.
- Khối "Chủ đề này dạy" chưa có: lessonTopic không trả danh sách ý dạy; cần API (một trường teaches), nên cột phải chỉ có 4 phần, Nên biết trước, Chủ đề liên quan.
- Thông báo gói miễn phí không có ổ khóa trong ô vuông như bản vẽ (Alert tone="accent" chỉ có dấu thông tin).
- Hàng bài đang học không tô xám (như catalog); Meter bốn phần chưa có nấc đang làm.
