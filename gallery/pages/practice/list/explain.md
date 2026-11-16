---
title: Luyện code (các pattern)
route: /practice
area: practice
---

Route: `/practice` (ảnh chụp: học viên chưa có Premium, chưa Accepted bài nào). Mã: `fe/apps/app/src/components/blocks/PracticeCatalog/component.tsx` (vẽ), `index.tsx` (đọc các pattern và tiến độ). Khung chung giải thích ở `learn/home`.

## Dải đầu trang "Luyện code"

Vì sao: dải trắng phẳng, viền dưới, sát trái, chỉ có tiêu đề 18/600: trang là gốc của mục nên không có đường dẫn và không có lệnh ở dải (lệnh chính "Mở toàn bộ bài" nằm trong thẻ giới thiệu).
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ title, titleScale: "standard", breadcrumbs: "root" }}` (`frame/Page/index.d.ts`).

## Thẻ giới thiệu "Luyện code"

Vì sao: nhãn khối trên một thẻ nền accent nhạt (soft): đoạn mở đầu nói chấm thật trên máy chấm với test ẩn và AI chỉ gợi ý, một dòng muted thống kê ("20 pattern · 96 bài · 0 bài Accepted"), dòng muted nói số bài Accepted tính vào mức sẵn sàng đi làm, rồi hàng nâng cấp: nút chính "Mở toàn bộ bài" và câu muted nói bản miễn phí mở một phần bài của mỗi pattern. Ảnh trước có một dòng "xxxxxxxxxxxxxx" thừa giữa đoạn mở đầu và dòng thống kê: lỗi khung xương (hai chữ giữ chỗ trùng khoá, React giữ lại phần tử cũ), đã sửa bằng chữ giữ chỗ khác độ dài ở `PRACTICE_CATALOG_PLACEHOLDER`; ảnh chụp lại không còn dòng đó.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md` (một nút chính), `type-scale-14-12.md`.
Grammar: `PracticeBrowse` (`fe/packages/starci-next-ui/src/composites/PracticeBrowse`) gồm `SurfaceCard treatment="soft" label`, `Text`, `UpsellRow` và `Button intent="commit" href`.

## Danh sách "Các pattern"

Vì sao: nhãn khối trên một thẻ danh sách hai mươi pattern: số thứ tự đơn sắc, tên 500 (Mảng, Chuỗi, Băm...), dòng 12 muted "0/5 bài Accepted", bên phải chip chữ "Premium" (pattern cần Premium cho phần lớn bài) và nút trung tính "Mở pattern". Hàng là điều hướng nên mỗi hàng là liên kết tới `practice/pattern`. Số thứ tự 10 trở đi rộng hơn nên tên lệch ba điểm ảnh so với hàng 1 đến 9.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ danh sách), `type-scale-14-12.md`. CHƯA RÕ: hai mươi hàng đều ghi "Premium" nên chữ ấy mất tác dụng phân biệt; cần chỉ ghi ở hàng thật sự khoá.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trên `SurfaceCard kind="list"`.
