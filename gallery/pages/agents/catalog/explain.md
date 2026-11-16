---
title: Agent và AI (danh mục công cụ)
route: /agents
area: agents
---

Route: `/agents` (ảnh chụp: học viên Premium, chưa có lab nào). Mã: `fe/apps/app/src/components/blocks/AgentLab/component.tsx` (vẽ), `index.tsx` (đọc). Trang trắng; danh sách và phần giới thiệu nằm phẳng, thẻ chỉ còn cho vật thật (ô công cụ).

## Đầu trang giới thiệu "Thao tác agent bằng công cụ bạn sẽ dùng ở công ty"

Vì sao: không thẻ: nhãn "Xây agent · công cụ thật, tư duy chuẩn" (chữ hoa muted), tiêu đề nói mục tiêu, đoạn giải thích rằng mọi công cụ chấm theo cùng bảy concept, và hai chip xám đếm ("3 công cụ", "7 concept"). CHƯA RÕ: đây chưa phải đầu trang chuẩn (18/600 + mô tả 12 muted): tiêu đề to hơn, đoạn mô tả màu foreground thay vì muted và nhãn nằm phía trên.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`), `Badge`.

## Hạn mức "Còn 50 lượt gọi model hôm nay"

Vì sao: đầu mục Section nói hạn mức hôm nay, dưới là một thanh tiến độ rộng hết cỡ (đầy khi còn đủ lượt, màu accent là tín hiệu trạng thái) và một dòng muted giải thích StarCi trả qua proxy, hết lượt thì lab dừng. Tách khỏi lưới công cụ vì là trạng thái của học viên.
Luật: `surface-layering` (Section phẳng), `theme-and-type` (accent chỉ là tín hiệu).
Grammar: `QuotaSection` và `AgentQuotaBar` (`fe/packages/starci-next-ui/src/composites/AgentQuotaBar`) trên `Progress`.

## Ba ô công cụ (Claude Code + Agent SDK, OpenClaw, Hermes Agent)

Vì sao: công cụ là vật thật nên còn là thẻ (hairline, không đổ bóng), ba thẻ cùng khuôn: avatar, tên, chip cách trả (Claude là "Tài khoản của bạn", hai thẻ kia "StarCi trả, có hạn mức"), chip "Phiên bản khoá theo lab", một câu mô tả, dòng "Chưa có lab". Chip Claude đã ngắn nên đứng cùng hàng với tên. CHƯA RÕ: ở 1440 và 1920 tên và avatar của Claude vẫn lệch vài px so với hai thẻ còn lại (chip của hai thẻ kia xuống dòng), "Phiên bản khoá theo lab" thụt vào so với tên; ba thẻ chỉ chiếm ba trong bốn cột. Ở 390 các thẻ xếp một cột.
Luật: `surface-layering` (thẻ chỉ cho vật thật), `type-scale-14-12.md`.
Grammar: `AgentLabGrid` và `AgentLabCell` (`fe/packages/starci-next-ui/src/composites/AgentLabGrid`) trên `SurfaceCard`, `Badge`.

## Danh sách "7 concept của tư duy chuẩn"

Vì sao: bảy hàng đánh số phẳng dưới đầu mục, ngăn bằng đường kẻ: số mono, tên concept (500), mô tả 12 muted; chip "Học thử miễn phí" (tông accent nhạt) ở hàng đầu bên phải. Ở 390 chip xuống dưới mô tả và mô tả hàng 2 và 3 bị cắt "…".
Luật: `surface-layering` (danh sách là Section, không thẻ), `type-scale-14-12.md`.
Grammar: `AgentConceptList` và `AgentConceptRow` (`fe/packages/starci-next-ui/src/composites/AgentConceptList`) trên `Section kind="list"`.

## Hai ô "Orca và công cụ khác" và "StarCi harness"

Vì sao: hai ô nhỏ nói điều chưa có: Orca và công cụ khác "sắp có", StarCi harness là phần cuối tuỳ chọn, chưa mở; harness chỉ là ví dụ, không phải phương pháp bắt buộc. CHƯA RÕ: đây là câu lẻ nhưng vẫn nằm trong thẻ, trái luật "một câu lẻ là một hàng của danh sách"; nên là hai hàng ngay dưới danh sách concept.
Luật: `surface-layering` (câu lẻ không phải thẻ).
Grammar: `AgentSoonCard` (`fe/packages/starci-next-ui/src/composites/AgentSoonCard`).

## "Bằng chứng nằm ở Dự án"

Vì sao: nói agent học viên làm là một dự án loại agent, StarCi chấm ở trang Dự án; kèm nút chính "Mở Dự án" (nút accent duy nhất của trang). Ở 390 nút giữ cỡ vừa chữ. CHƯA RÕ: khối còn là thẻ bao một câu và một nút; nên là Section phẳng.
Luật: `surface-layering` (một nút chính mỗi màn hình), `verify-against-visualize.md`.
Grammar: `Button intent="commit" href` (`leaf/Button`).
