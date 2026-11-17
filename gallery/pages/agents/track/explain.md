---
title: Một công cụ agent (lab theo concept)
route: /agents/tracks/[trackId]
area: agents
reviewed: 2026-11-17
---

Route: `/agents/tracks/[trackId]` (ảnh chụp: `claude`, học viên Premium, chưa có lab). Mã: `fe/apps/app/src/components/blocks/AgentTrack/component.tsx`. Trang trắng, các khối phẳng dưới đầu mục, không thẻ bao quanh.

## Liên kết "Tất cả công cụ"

Vì sao: trang con của `agents/catalog` nên đầu trang là liên kết quay lại, chữ foreground. CHƯA RÕ: liên kết đứng riêng, không có mũi tên và không nằm trong đường dẫn của `Page`; nên là `Page header.breadcrumbs`.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (liên kết điều hướng có mũi tên).
Grammar: `Link variant="plain"`; cần `Page header.breadcrumbs`.

## Đầu công cụ

Vì sao: nhãn "Công cụ" (chữ hoa muted), tên "Claude Code + Agent SDK" cỡ 20/600, một câu mô tả và ba chip xám (cách trả "Tài khoản của bạn", phiên bản khoá theo lab, "Chưa có lab"). Không thẻ. CHƯA RÕ: chưa phải đầu trang chuẩn 18/600 + mô tả muted (tên to hơn, mô tả màu foreground).
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`), `Badge`.

## "Dùng tài khoản Anthropic của bạn"

Vì sao: đầu mục Section với một dòng muted nói Claude Code cần đăng nhập tài khoản riêng, StarCi không trả; học viên biết trước khi vào lab.
Luật: `surface-layering` (Section phẳng).
Grammar: `QuotaSection` (`fe/packages/starci-next-ui/src/composites/AgentQuotaBar`).

## Danh sách "Lab theo concept"

Vì sao: bảy hàng đánh số phẳng, ngăn bằng đường kẻ: số mono, tên concept, dòng phụ muted và trạng thái bên phải. Hàng không bấm được vì chưa có lab; khi có lab là liên kết có mũi tên. CHƯA RÕ: chữ "Thầy đang soạn" lặp hai lần ở mỗi hàng (dòng phụ và trạng thái bên phải); chỉ nên giữ một.
Luật: `surface-layering`, `type-scale-14-12.md`.
Grammar: `AgentLabGrid` hoặc `AgentConceptList` và `AgentConceptRow` (`fe/packages/starci-next-ui/src/composites/AgentConceptList`) trên `Section kind="list"`.

## "Bằng chứng nằm ở Dự án"

Vì sao: cùng khối chốt như trang danh mục, kèm nút chính "Mở Dự án" (nút accent duy nhất). CHƯA RÕ: còn là thẻ bao một câu và một nút; nên là Section phẳng.
Luật: `surface-layering` (một nút chính, câu lẻ không phải thẻ).
Grammar: `AgentSoonCard` và `Button intent="commit" href`.
