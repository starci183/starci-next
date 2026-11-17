---
title: Premium (chọn gói và thanh toán)
route: /premium
area: commerce
reviewed: 2026-11-17
---

Route: `/premium` (ảnh chụp: học viên đang là Premium, gói năm và SePay đang chọn mặc định, nên nút là "Gia hạn thêm"). Mã: `fe/apps/app/src/components/blocks/PremiumPlans/component.tsx` (vẽ), `index.tsx` (đọc giá, tạo đơn). Trang trắng; lựa chọn là radio phẳng dưới đầu mục, chỉ bản tóm tắt gói là thẻ.

## Đầu trang "Học không giới hạn với Premium"

Vì sao: đầu trang chuẩn, sát trái, đường kẻ dưới: tiêu đề 18/600 và mô tả 12 muted nói luật tiền ("Trả một lần cho mỗi kỳ. Không tự gia hạn, không tự trừ tiền."). Lệnh chính nằm ở thẻ tóm tắt cạnh số tiền, không ở đầu trang.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, description }}`.

## Thông báo trạng thái Premium hiện tại

Vì sao: một Alert thông tin nói "Bạn đang là Premium đến 17 thg 11, 2028" và mua thêm sẽ cộng tiếp từ ngày đó, không mất ngày nào; icon thông tin ở đầu. CHƯA RÕ: Alert vẫn có nền xám nhạt (giếng tô màu) dù luật chỉ cho đường kẻ; cần nền trắng viền 1px hoặc tông thông tin xám theo luật.
Luật: `theme-and-type` (info là xám trung tính, không giếng tô màu), `surface-layering`.
Grammar: `Alert tone="informative"` (`composite/Alert`).

## "Premium gồm những gì"

Vì sao: đầu mục Section; dòng lợi ích mở đầu bằng dấu tích (✓), không phải vòng rỗng, nên không giống radio chưa chọn; một dòng muted dưới nói hết hạn là quay về bản xem trước ngay, không có thời gian ân hạn, gia hạn bất cứ lúc nào.
Luật: `surface-layering` (bullet là dấu tích, không vòng rỗng), `type-scale-14-12.md`.
Grammar: `Section`, `Text startContent={<Icon />}` với glyph dấu tích (`fe/packages/starci-next-ui/src/leaves/Icon`).

## Nhóm radio "Chọn gói"

Vì sao: đầu mục "Chọn gói", hai hàng radio loại trừ: "Premium hằng tháng · 229.000 đ" (dùng 1 tháng, hết hạn thì mua tiếp nếu muốn) và "Premium hằng năm · 2.290.000 đ" (bằng giá 10 tháng). Hàng chọn nền xám nhạt, viền đậm, radio tô accent; hàng chưa chọn trắng viền 1px. Giá do máy chủ định, trang chỉ đọc.
Luật: `theme-and-type` (chọn là gray, accent chỉ cho control đã chọn), `verify-against-visualize.md`.
Grammar: `RadioGroup` với `Radio description` (`composite/RadioGroup`).

## Nhóm radio "Thanh toán qua"

Vì sao: cổng thanh toán là nhóm radio thứ hai, SePay (mặc định, có dòng phụ "Mặc định") và payOS; tách khỏi nhóm gói để học viên chọn hai việc độc lập.
Luật: `theme-and-type`, `verify-against-visualize.md`.
Grammar: `RadioGroup`.

## Tóm tắt gói và nút "Gia hạn thêm"

Vì sao: bản tóm tắt gói là vật thật nên còn là thẻ hairline, không đổ bóng: dòng muted nói gói và cổng đã chọn ("Premium hằng năm · SePay"), số tiền đậm, một câu nói gia hạn cộng thêm từ ngày nào và Premium chỉ gia hạn khi cổng xác nhận đã nhận tiền; rồi MỘT nút chính accent "Gia hạn thêm" (không icon; "Tiếp tục thanh toán" khi chưa có Premium). Ở 390 nút rộng hết thẻ. Kết quả về `commerce/premium-result`.
Luật: `surface-layering` (một nút chính, thẻ cho vật thật là plan summary).
Grammar: `SurfaceCard`, `Heading`, `Text`, `Button intent="commit" width="fill-narrow"`.

## Trạng thái đang tải, lỗi

Vì sao: không có trong ảnh. Khi giá đang đọc, hai nhóm hiện khung xương cùng hình học; khi lỗi, thông báo có nút trung tính "Thử lại"; `Alert tone="negative"` khi tạo đơn thất bại, nói lý do ngay trên nút.
Luật: `grammar-slot-interface` (chỉ SlotView rẽ nhánh), `surface-layering` (lỗi nằm trong section).
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`), `Alert tone="negative"`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1920: tiêu đề và mô tả của đầu trang dính x=288 trong khi thân (thông báo, nhóm radio, thẻ tóm tắt) căn giữa bắt đầu x=480; hai trục lề lệch nhau gần 200px (surface-layering: đầu trang sát trái, thân tối đa 80rem).
- 1440, 1920, 390, thông báo "Bạn đang là Premium...": nền xám tô kín bo lớn (giếng tô màu), không phải nền trắng viền 1px; chữ đậm ở dòng một và thường ở dòng hai gần như cùng cỡ.
- 1440, 1920, 390, nhóm radio: hàng đang chọn có nền xám tô kín cộng viền đen đậm 1px, nặng nhất trang; hai nhóm "Chọn gói" và "Thanh toán qua" đều là các hàng thẻ viền bo góc lớn, chiếm cả bề ngang (1440 và 1920 dài hơn 1100px) cho chỉ hai lựa chọn ngắn, nên nhiều thẻ lồng như danh sách thay vì hàng phẳng.
- 1440, 1920, 390, dòng phụ trong radio ("Dùng 1 tháng...", "Bằng giá 10 tháng.", "Mặc định") cỡ 12 xám nhạt, tương phản thấp, và thụt vào so với nhãn radio.
- 1440, 1920, 390, nút "Gia hạn thêm": tím nhạt chữ đen, tương phản thấp; ở 1440 và 1920 nút dồn lề trái trong thẻ rộng hơn 1100px, bỏ trống phần còn lại; ở 390 nút rộng hết thẻ.
- 1440, 1920, 390, thẻ tóm tắt gói: dòng "Premium hằng năm · SePay" xám nhạt nhỏ, số tiền cỡ 14 đậm (không nổi hơn nhãn), câu giải thích dài xám nhạt; số tiền là con số quan trọng nhất nhưng không được nhấn.
- 1440, 1920, 390, dòng "Mở toàn bộ nội dung đang là bản xem trước" là một dòng lợi ích duy nhất, đứng một mình dưới đầu mục "Premium gồm những gì" với dấu tích lớn đậm hơn chữ.
- 1440, 1920, 390, sidebar không có mục nào được chọn; thanh trên có nút tròn tô xám, công tắc sáng tối tô xám, avatar đỏ bão hoà.
