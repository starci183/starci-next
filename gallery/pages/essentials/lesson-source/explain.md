---
title: Bản chất / Bài học · phần 2 Source
route: /essentials/[topic]/[lesson]?part=source
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=source`. Phần 2 của bài: tải source TypeScript của bài và chạy, sơ đồ kiến trúc với luật mỗi thành phần giữ, rồi đọc code: mỗi đoạn trùng byte với source, gắn bất biến và `file:dòng`. Cần Premium (thiếu thì hiện LockedNotice). Code: `EssentialSource` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, builder `sourceOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`.

## Tải source và chạy

Vì sao: một khối lệnh có nút Copy: `npx @starci/next pull <bài>`, `cd <bài>`, `starci-next up`. Source nằm trong `starci-next-seed-standard` (`essentials/<topic>/<bài>/source/`), CLI tải tarball có ký sha256 qua relay; chỉ TypeScript.
Luật: COOK 2026-11-17 phần 2; SCENARIO-CONTRACT v3 §3–§4; owner pivot "TS only".
Grammar: `Section description` (`frame/Section/index.d.ts`), `FencedCodeBlock code language label` (`frame/MarkdownArticle/index.d.ts`).

## Kiến trúc (sơ đồ + bảng "Luật nó giữ")

Vì sao: sơ đồ mermaid của thầy, dưới đó bảng phẳng Thành phần · Port · Luật nó giữ (mã bất biến và tên của nó).
Luật: COOK 2026-11-17 phần 2 ("architecture diagram (mermaid) + components table with a Luật nó giữ column"); white-theme BRIEF (bảng phẳng trên bề mặt).
Grammar: `MermaidDiagram source label errorTitle` (`frame/MermaidDiagram/index.d.ts`), `DataTable` (`branch/DataTable/index.d.ts`).

## Đọc code (mỗi đoạn một mục)

Vì sao: tiêu đề mục, chip `file:dòng` ở dòng tiêu đề, chip accent là bất biến đoạn code giữ, code tô màu, dòng muted "Vì sao". Đoạn code là bằng chứng để đọc, không phải để gõ lại.
Luật: COOK 2026-11-17 ("code explanation snippets diff=0 with the repo, each tagged with the invariant + file:line"); owner pivot "dạy bản chất, không dạy code".
Grammar: `Section fact` (`frame/Section/head.d.ts`), `Badge tone="accent"` (`leaf/Badge/index.d.ts`), `HighlightedCode` (`fe/packages/starci-next-ui/src/branches/HighlightedCode/index.tsx`), `Text tone="muted"` (`leaf/Text/index.d.ts`).
