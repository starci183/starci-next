---
title: Một công cụ agent (lab theo concept)
route: /agents/tracks/[trackId]
area: agents
---

Route: `/agents/tracks/[trackId]` (ảnh chụp: `claude`, học viên chưa có Premium). Mã: `fe/apps/app/src/components/blocks/AgentTrack/component.tsx`. Khung chung giải thích ở `learn/home`.

## Liên kết "Tất cả công cụ"

Vì sao: đây là một trang con của danh mục `agents/catalog`, nên đầu trang là liên kết quay lại, không phải dải tiêu đề. CHƯA RÕ: liên kết đứng một mình trên nền xám không có dấu mũi tên quay lại và cách thẻ bên dưới một khoảng lớn; nên là một dải đường dẫn của `Page` (`breadcrumbs`).
Luật: `page-header-left-sublabel-xs.md` (đầu trang trái, đường dẫn là một phần của dải), `type-scale-14-12.md`.
Grammar: `Link` (`leaf/Link`) trong `Stack`; cần `Page header.breadcrumbs`.

## Thẻ công cụ

Vì sao: thẻ trắng nổi giống thẻ mở đầu danh mục: nhãn "Công cụ", tên "Claude Code + Agent SDK", một câu mô tả và ba chip (cách trả, phiên bản khoá theo lab, "Chưa có lab"). Tên 20/600 để tách khỏi nhãn.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `CatalogIntro` trên `SurfaceCard` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`), `Badge`.

## Thẻ "Dùng tài khoản Anthropic của bạn"

Vì sao: thẻ phụ nói ai trả tiền cho công cụ này: tiêu đề và một dòng muted nói Claude Code cần đăng nhập tài khoản riêng, StarCi không trả. Học viên biết trước khi vào lab.
Luật: `pink-page-surface-rule.md`.
Grammar: `QuotaSection`/`SurfaceCard` (`fe/packages/starci-next-ui/src/composites/AgentQuotaBar`).

## Danh sách "Lab theo concept"

Vì sao: bảy hàng đánh số, mỗi hàng là một concept với dòng "Thầy đang soạn" (lab chưa có) và bên phải trạng thái: "Thầy đang soạn" ở hàng đầu, "Cần Premium" (chip) ở sáu hàng sau. Hàng không bấm được vì chưa có lab; khi có lab sẽ là liên kết với mũi tên ›.
Luật: `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `AgentConceptList` và `AgentConceptRow` (`fe/packages/starci-next-ui/src/composites/AgentConceptList`) trên `SurfaceCard kind="list"`.

## Thẻ "Bằng chứng nằm ở Dự án"

Vì sao: cùng thẻ chốt như trang danh mục, nút chính "Mở Dự án".
Luật: `verify-against-visualize.md`.
Grammar: `Button intent="commit" href`.
