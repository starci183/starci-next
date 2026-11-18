---
title: Phần khóa · Source (tài khoản miễn phí)
route: /essentials/[topic]/[lesson]?part=source
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials/[topic]/[lesson]?part=source`. Một trang dùng cho phần 2, 3 và 4; đổi tên phần và ba dòng. Code: `fe/apps/app/src/components/blocks/EssentialLesson/` (vỏ trang, `parts/partEssence.tsx`, `parts/partLocked.tsx`), hook `fe/apps/app/src/hooks/essence/`, composite `fe/packages/starci-next-ui/src/composites/LessonEssence/` và `LessonLockedPart/`.

## Dải đầu bài (đường dẫn, tên bài, bài toán, dòng sự kiện, nút chính, bốn tab)

Vì sao: đường dẫn Essentials, chủ đề, bài; tên bài; một câu bài toán nghiệp vụ; dòng sự kiện "Bài 3/6 trong chủ đề · 20 phút đọc · 5 kịch bản · 4 mức tự áp dụng" (số bài lấy từ đường đi của chủ đề). Nút chính duy nhất do phần đang mở giao cho dải: Câu tiếp theo, Câu n, Xem kết quả, Đọc bài viết, Làm lại 5 câu, Nâng cấp Premium. Bốn tab phần nằm trên đường kẻ đáy; phần đang dở có chip đếm số đã xong, phần xong có dấu tích, phần cần Premium có ổ khóa; nhãn tab luôn hiện chữ.
Luật: `app.essentials.essential` trong thông điệp; `ui/components/page-header.md` (một nút chính ở cuối hàng tiêu đề); `ui/components/tabs.md` (tab trang có đếm).
Grammar: `Page header { breadcrumbs, title, description, meta, actions, tabs: { kind: "views", labelVisibility: "always", items[{ count, leading }] } }` (`frame/PageHeader`, `branch/Tabs`). Code: `EssentialLesson/component.tsx` (`bandOf`).

## Phần khóa (thông báo, ba dòng phần có gì)

Vì sao: một thông báo nói thẳng "Phần n · tên thuộc gói Premium" và rằng điểm 5 câu mở bài cùng tiến độ giữ nguyên khi nâng cấp; dưới là "Quay lại phần 1" và liên kết "So sánh hai gói"; rồi "Trong phần này bạn có" với ba dòng đánh số. Máy chủ không gửi nội dung phần khóa cho tài khoản miễn phí (`lockedParts`), nên không có bản xem trước mờ; nút chính là "Nâng cấp Premium". Ba tab sau có ổ khóa thay cho số đếm.
Luật: `premium.md`; `essentials.md` (phần 1 miễn phí); `conventions.md` luật 1 và 4 (khóa do máy chủ quyết, không chỉ ẩn ở giao diện).
Grammar: `Alert tone="accent" leading={IconTile}`, `Button intent="neutral"`, `Link`, `Section kind="list"` với `leading: { position }` (`composite/Alert`, `leaf/Link`). Code: `LessonLockedPart/index.tsx`.

## Phản biện

Vì sao: tự phản biện của lần chụp này (lõi giả của lane, ảnh ở 1440, 1920 và 390); liệt kê điều còn lệch bản vẽ, không sửa trong lần chụp.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đường dẫn: dải đầu đặt dòng sự kiện trên câu bài toán, còn bản vẽ đặt dưới; `PageHeader` cố định thứ tự `meta` rồi `description`. Cần Grammar cho phép đổi thứ tự, chưa sửa.
- Thanh năm đoạn: `Stepper kind="bar"` tô đoạn đúng bằng màu nhấn (tím), không phải xanh; chỉ đoạn sai có màu đỏ. Bản vẽ muốn xanh/đỏ (GRAMMAR-GAPS #3). Dùng phần tử gần nhất, ghi vào báo cáo.
- Đáp án có hàng số "1." đến "4." thay cho vòng chữ A đến D của bản vẽ: `ListRow` chỉ có số thứ tự (không có chữ cái); cần Grammar nếu chủ muốn chữ cái.
- Chip đếm trên tab chỉ hiện số đã xong ("2"), bản vẽ hiện "2/5"; `Tabs count` chỉ nhận một số.
- Dùng màn cũ của khung (thanh bên cũ); khung do lane build-01 giữ nên ảnh chưa có thanh bên mới.
- Bản vẽ có sơ đồ xem trước mờ dưới ba dòng; bản build không có, vì máy chủ không gửi nội dung phần khóa và một sơ đồ mẫu sẽ là nội dung bịa. Chữ của thông báo màu nhấn (tím) vì `Alert tone="accent"` tô chữ theo màu nhấn, bản vẽ dùng chữ trung tính.
