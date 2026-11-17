---
title: Premium (chọn gói và thanh toán)
route: /premium
area: commerce
reviewed: 2026-11-17
---

Route: `/premium` (ảnh chụp: học viên chưa có Premium, gói năm và SePay đang chọn mặc định). Mã: `fe/apps/app/src/components/blocks/PremiumPlans/component.tsx` (vẽ), `index.tsx` (đọc giá, tạo đơn). Khung chung giải thích ở `learn/home`.

## Dải tiêu đề "Học không giới hạn với Premium"

Vì sao: dải trắng phẳng, viền dưới, sát trái: tiêu đề 18/600 và một dòng muted nói luật tiền ("Trả một lần cho mỗi kỳ. Không tự gia hạn, không tự trừ tiền."). Trang không có lệnh ở dải vì lệnh chính "Tiếp tục thanh toán" nằm ở thẻ cuối, cạnh số tiền.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, description }}` (`frame/Page/index.d.ts`).

## Khối "Premium gồm những gì"

Vì sao: nhãn khối trên một thẻ: một dòng đậm nói Premium mở toàn bộ nội dung đang là bản xem trước, và một dòng muted nói hết hạn là quay về bản xem trước ngay, không có thời gian ân hạn. CHƯA RÕ: dòng đậm bắt đầu bằng một vòng tròn rỗng (`Icon` không có `source`) trông giống nút radio chưa chọn, dễ nhầm với hai nhóm radio bên dưới; cần icon dấu tích hoặc bỏ icon.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ), `verify-against-visualize.md` (icon đứng cạnh chữ phải có nghĩa).
Grammar: `SurfaceCard label`, `Text startContent={<Icon />}` (`fe/packages/starci-next-ui/src/leaves/Icon`).

## Nhóm radio "Chọn gói"

Vì sao: hai gói là hai hàng radio: "Premium hằng tháng · 229.000 đ" (dùng 1 tháng, hết hạn thì mua tiếp nếu muốn) và "Premium hằng năm · 2.290.000 đ" (bằng giá 10 tháng). Hàng đang chọn nền accent nhạt, hàng không chọn nền xám nhạt; giá do máy chủ định, trang chỉ đọc. Đây là hai lựa chọn loại trừ nhau nên là radio, không phải hai nút.
Luật: `verify-against-visualize.md`, `type-scale-14-12.md` (dòng phụ 12 muted).
Grammar: `RadioGroup` với `Radio` có `description` (`composite/RadioGroup`).

## Nhóm radio "Thanh toán qua"

Vì sao: cổng thanh toán là nhóm radio thứ hai, SePay (mặc định) và payOS, tách khỏi nhóm gói để học viên chọn hai việc độc lập. Chỉ dòng "Mặc định" ở SePay.
Luật: `verify-against-visualize.md`.
Grammar: `RadioGroup` như trên.

## Thẻ tóm tắt đơn và nút "Tiếp tục thanh toán"

Vì sao: thẻ trắng nổi chốt: dòng muted nói gói và cổng đã chọn, số tiền đậm, một câu nói bạn sẽ sang trang của cổng và Premium chỉ kích hoạt khi cổng xác nhận đã nhận tiền; rồi MỘT nút chính "Tiếp tục thanh toán" (không icon, chỉ chữ). Bấm tạo đơn rồi chuyển sang cổng; kết quả về `commerce/premium-result`.
Luật: `verify-against-visualize.md` (một nút chính mỗi vùng), `pink-page-surface-rule.md`.
Grammar: `SurfaceCard`, `Heading`, `Text`, `Button intent="commit"` (`leaf/Button`).

## Trạng thái đang tải, lỗi và cảnh báo

Vì sao: không có trong ảnh. Khi giá đang đọc, hai nhóm hiện khung xương cùng hình học; khi lỗi, thông báo có nút "Thử lại"; có `Alert tone="informative"` cho ghi chú của gói và `Alert tone="negative"` khi tạo đơn thất bại, nói lý do ngay trên nút.
Luật: `grammar-slot-interface` (chỉ SlotView rẽ nhánh), `verify-against-visualize.md`.
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`), `Alert` (`composite/Alert`).
