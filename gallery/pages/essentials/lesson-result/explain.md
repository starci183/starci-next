---
title: Bản chất · kết quả năm câu
route: /essentials/[topic]/[lesson]
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]`. Sau câu thứ năm, nút "Xem kết quả" mở màn kết quả: điểm, mục cần đọc kỹ, mục lục và hai nút phụ. Code: `fe/apps/app/src/components/blocks/EssentialLesson/` (vỏ trang, `parts/partEssence.tsx`, `parts/partLocked.tsx`), hook `fe/apps/app/src/hooks/essence/`, composite `fe/packages/starci-next-ui/src/composites/LessonEssence/` và `LessonLockedPart/`.

## Dải đầu bài (đường dẫn, tên bài, bài toán, dòng sự kiện, nút chính, bốn tab)

Vì sao: đường dẫn Essentials, chủ đề, bài; tên bài; một câu bài toán nghiệp vụ; dòng sự kiện "Bài 3/6 trong chủ đề · 20 phút đọc · 5 kịch bản · 4 mức tự áp dụng" (số bài lấy từ đường đi của chủ đề). Nút chính duy nhất do phần đang mở giao cho dải: Câu tiếp theo, Câu n, Xem kết quả, Đọc bài viết, Làm lại 5 câu, Nâng cấp Premium. Bốn tab phần nằm trên đường kẻ đáy; phần đang dở có chip đếm số đã xong, phần xong có dấu tích, phần cần Premium có ổ khóa; nhãn tab luôn hiện chữ.
Luật: `app.essentials.essential` trong thông điệp; `ui/components/page-header.md` (một nút chính ở cuối hàng tiêu đề); `ui/components/tabs.md` (tab trang có đếm).
Grammar: `Page header { breadcrumbs, title, description, meta, actions, tabs: { kind: "views", labelVisibility: "always", items[{ count, leading }] } }` (`frame/PageHeader`, `branch/Tabs`). Code: `EssentialLesson/component.tsx` (`bandOf`).

## Kết quả năm câu

Vì sao: thanh năm đoạn đủ màu, "Đúng 3/5", một câu nói mục nào được đánh dấu "nên đọc kỹ", mục lục, hai nút phụ "Đọc bài viết" và "Xem lại 5 câu". Làm lại xong thì thêm dòng "Làm lại: 5/5 (trước 3/5)". Tài khoản miễn phí thấy thêm thông báo "Bạn xong phần 1" nói source, kịch bản và mức tự áp dụng thuộc Premium, và nút chính ở dải đầu đổi thành "Nâng cấp Premium".
Luật: `premium.md` (phần 1 miễn phí, phần 2 đến 4 cần Premium); `ui/components/toast-alert.md` (thông báo giải thích, không chặn).
Grammar: `Stepper kind="bar"`, `Section kind="list"`, `ButtonGroup`-less `Cluster` của hai `Button intent="neutral"`, `Alert tone="accent" leading={IconTile}` (`composite/Alert`, `leaf/IconTile`). Code: `LessonEssence/index.tsx` (`LessonResult`).

## Cột phải (chỉ từ 1440)

Vì sao: "Bài này gồm 4 phần" liệt kê bốn phần (phần xong có dấu tích, phần cần Premium là hàng không mở được) và "Cuối bài": nhắc làm lại 5 câu để thấy điểm trước và sau. Dưới 70rem cột này ẩn; mục lục không nằm ở cột phải mà nằm trong thân (xem Phản biện).
Luật: `ui/composition.md` (cột phải là các khối phẳng ngăn bằng đường kẻ, không thẻ).
Grammar: `PaneGrid areas={{ base: ["main"], wide: ["main aside"] }}` + `Pane area="aside" surface`, `PaneSection rule="start"`, `Section kind="list"` với `ListRow state="unavailable"` (`frame/PaneGrid`, `frame/Section`).

## Phản biện

Vì sao: tự phản biện của lần chụp này (lõi giả của lane, ảnh ở 1440, 1920 và 390); liệt kê điều còn lệch bản vẽ, không sửa trong lần chụp.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đường dẫn: dải đầu đặt dòng sự kiện trên câu bài toán, còn bản vẽ đặt dưới; `PageHeader` cố định thứ tự `meta` rồi `description`. Cần Grammar cho phép đổi thứ tự, chưa sửa.
- Thanh năm đoạn: `Stepper kind="bar"` tô đoạn đúng bằng màu nhấn (tím), không phải xanh; chỉ đoạn sai có màu đỏ. Bản vẽ muốn xanh/đỏ (GRAMMAR-GAPS #3). Dùng phần tử gần nhất, ghi vào báo cáo.
- Đáp án có hàng số "1." đến "4." thay cho vòng chữ A đến D của bản vẽ: `ListRow` chỉ có số thứ tự (không có chữ cái); cần Grammar nếu chủ muốn chữ cái.
- Chip đếm trên tab chỉ hiện số đã xong ("2"), bản vẽ hiện "2/5"; `Tabs count` chỉ nhận một số.
- Dùng màn cũ của khung (thanh bên cũ); khung do lane build-01 giữ nên ảnh chưa có thanh bên mới.
- Mục lục: bản vẽ đặt mục lục ở cột phải ở 1440; ở đây mục lục nằm trong thân ở mọi độ rộng, vì cột phải ẩn dưới 70rem và ở 390 mục lục phải đứng trước bài viết. `PaneGrid` không cho một khối vừa ở thân vừa ở cột phải theo độ rộng; chờ quyết định.
