---
title: Sự cố (danh mục bài sửa lỗi thật)
route: /incidents
area: incidents
---

Route: `/incidents` (ảnh chụp: học viên chưa có thiết bị nào nối, nên mọi sự cố đều ghi "Sắp có"). Mã: `fe/apps/app/src/components/blocks/IncidentsList/component.tsx`. Khung chung giải thích ở `learn/home`.

## Thẻ mở đầu "Sự cố"

Vì sao: thẻ trắng nổi mở trang: nhãn "Sửa lỗi thật · tầng 2 của Bản chất", tiêu đề, một đoạn nói mỗi sự cố là một lỗi thật trong repo của thầy viết như triệu chứng ở production, và hai chip xám đếm ("10 bài học", "0 sự cố đã mở").
Luật: `pink-page-surface-rule.md`, `table-heroui-native-section-head.md` (chip xám), `type-scale-14-12.md`.
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`).

## Dòng "Chạy sự cố cần thiết bị đã kết nối — sắp có"

Vì sao: một dòng muted nói điều kiện chạy một sự cố (cần máy đã nối, xem `devices/list`) và nói thẳng là chưa có. Nó đứng ngoài thẻ vì là ghi chú cho cả trang.
Luật: `type-scale-14-12.md`, `verify-against-visualize.md`.
Grammar: `Text tone="muted"` (`leaf/Text`).

## Các nhóm theo chủ đề và hàng sự cố

Vì sao: sự cố gom theo chủ đề (Backend framework, Server state, Communication patterns, Testing strategy, Kubernetes, Cloud networking, LLM & agent, Cơ sở dữ liệu, Độ tin cậy của API): mỗi nhóm có nhãn đậm trên một thẻ danh sách. Hàng gồm tên sự cố 500, dòng 12 muted "Nền tảng · 65 phút" (bậc và thời lượng) và bên phải chip "Sắp có". Hàng không bấm được cho đến khi sự cố có thật; khi có sẽ là liên kết. CHƯA RÕ: mười hàng đều "Sắp có" nên trang là một danh sách dài không làm được gì; chờ sự cố đầu tiên mở. Nhóm chỉ có một hàng vẫn chiếm một thẻ riêng nên trang rất dài ở 390.
Luật: `table-heroui-native-section-head.md` (nhãn trên thẻ danh sách), `type-scale-14-12.md`.
Grammar: `IncidentGroups` (`fe/packages/starci-next-ui/src/composites/IncidentGroups`) trên `SurfaceCard kind="list"`, `Badge`.
