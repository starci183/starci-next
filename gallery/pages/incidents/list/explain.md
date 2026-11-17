---
title: Sự cố (danh mục bài sửa lỗi thật)
route: /incidents
area: incidents
reviewed: 2026-11-17
---

Route: `/incidents` (ảnh chụp: học viên chưa có thiết bị nào nối, nên mọi sự cố đều ghi "Sắp có"). Mã: `fe/apps/app/src/components/blocks/IncidentsList/component.tsx`. Khung chung giải thích ở `learn/home`.

## Phần mở đầu "Sự cố"

Vì sao: phần mở đầu phẳng trên nền trắng, không thẻ, không có dải tiêu đề riêng: nhãn nhỏ viết hoa "Sửa lỗi thật · tầng 2 của Bản chất", tiêu đề "Sự cố", một đoạn nói mỗi sự cố là một lỗi thật trong repo của thầy viết như triệu chứng ở production, và hai chip xám đếm ("11 bài học", "0 sự cố đã mở"). CHƯA RÕ: trang không có dải tiêu đề `Page header` (viền dưới) như các trang khác, nên tiêu đề nằm trực tiếp trên thân trang.
Luật: `surface-layering` (phẳng trên nền trắng), `theme-and-type` (chip là xám).
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`).

## Dòng "Chạy sự cố cần thiết bị đã kết nối — sắp có"

Vì sao: một dòng muted nói điều kiện chạy một sự cố (cần máy đã nối, xem `devices/list`) và nói thẳng là chưa có. Nó là ghi chú cho cả trang nên đứng ngoài các nhóm.
Luật: `theme-and-type`, `surface-layering`.
Grammar: `Text tone="muted"` (`leaf/Text`).

## Các nhóm theo chủ đề và hàng sự cố

Vì sao: sự cố gom theo chủ đề (Backend framework, Độ tin cậy của API, Server state, Communication patterns, Testing strategy, Kubernetes, Cloud networking, LLM & agent, Cơ sở dữ liệu): mỗi nhóm là một `Section` phẳng với tên nhóm làm đầu mục và các hàng bên dưới. Hàng gồm tên sự cố 500, dòng 12 muted "Nền tảng · 65 phút" (bậc và thời lượng) và bên phải chữ muted "Sắp có". Hàng không bấm được cho đến khi sự cố có thật; khi có sẽ là liên kết. Đường kẻ 1px chỉ ngăn hàng trong cùng nhóm; nhóm chỉ có một hàng không có đường kẻ nào. CHƯA RÕ: mười một hàng đều "Sắp có" nên trang là một danh sách dài không làm được gì; chờ sự cố đầu tiên mở. Khoảng cách giữa các nhóm lớn nên trang rất dài ở 390.
Luật: `surface-layering` (danh sách là Section, không thẻ), `theme-and-type`.
Grammar: `IncidentGroups` (`fe/packages/starci-next-ui/src/composites/IncidentGroups`) gồm `Section` và `Text`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: dòng "Chạy sự cố cần thiết bị đã kết nối — sắp có." muted ngả nâu đứng lẻ ngoài các nhóm.
- 1440: tiêu đề nhóm sát trái x=288 còn hàng sự cố thụt vào x=300; hai trục trái lệch mười hai điểm ảnh.
- 1440: nhóm chỉ một hàng thì không có đường kẻ, nhóm cách nhau khoảng 140px nên trang dài; cả mười một hàng "Sắp có" nên không có việc nào làm được.
- 1440: "Sắp có" là chữ muted nhỏ trần, không phải chip, lệch kiểu với trạng thái ở các trang khác.
- 1920: nội dung co vào giữa (x=480); hàng sự cố vẫn thụt 12px so với tiêu đề nhóm; "Sắp có" cách tên hơn 800px nên khó đọc ngang hàng.
- 390: tên sự cố bẻ dòng để chữ mồ côi ("lần", "lại?"); "Sắp có" chiếm cột phải làm hẹp tên; khoảng cách nhóm lớn nên trang dài.
