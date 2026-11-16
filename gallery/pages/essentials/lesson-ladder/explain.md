---
title: Bản chất / Bài học · phần 4 Tự áp dụng
route: /essentials/[topic]/[lesson]?part=apply
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=apply`. Phần 4: thang thử thách 4 bậc của thầy. Mỗi bậc chấm bằng kịch bản ẩn (CLI chạy, relay gửi về: "Đang luyện"), phần kiểm tra bản chất (trắc nghiệm, chấm tất định) và thang điểm 100 có một tiêu chí trọng yếu; CI GitHub có OIDC mới lên "Đã chứng minh". Bậc trên mở khi mọi kịch bản ẩn của bậc dưới đã xanh. Cần Premium. Code: `EssentialApply` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, `applyOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`.

## Thang 4 bậc

Vì sao: danh sách phẳng Dễ · Vừa · Khó · Siêu khó, mỗi hàng chip trạng thái Khóa / Đang luyện / Đã xanh; bấm để xem bậc; mặc định là bậc cao nhất đang mở.
Luật: COOK 2026-11-17 phần 4 ("challenge ladder easy/medium/hard/insane"); white-theme BRIEF "LIMIT CARDS".
Grammar: `Section kind="list" items[{ title, badges, onPress, state }]` (`frame/Section/index.d.ts`).

## Bậc đang xem: đề bài và thang điểm

Vì sao: tiêu đề "Mức · tên", đề bài markdown; thang điểm là danh sách phẳng mỗi tiêu chí một chip điểm, tiêu chí trọng yếu có chip accent "Trọng yếu".
Luật: COOK 2026-11-17 ("rubric scoring (100, one critical 40-pt item)").
Grammar: `Markdown` (`frame/Markdown/index.d.ts`), `Section kind="list" badges` (`surfaceCardData.d.ts` `BadgeData`).

## Kiểm tra bản chất, kịch bản ẩn, đường tới Đã chứng minh

Vì sao: các câu trắc nghiệm/quyết định thiết kế (attempt `challenge.<bậc>.<id>`, chấm ngay, giải thích sau khi nộp); mục "Kịch bản ẩn" có chip "x/y kịch bản ẩn xanh" và lệnh `starci-next run <bài> --challenge <bậc>`; dòng muted nói đường Đang luyện → push GitHub, CI ký OIDC → Đã chứng minh. Bậc chưa mở chỉ hiện đề và thang điểm cùng một dòng nói điều kiện mở.
Luật: owner pivot 2026-11-17 ("hidden scenarios + an essence check … graded deterministically … proof still needs CI OIDC"); concept `learner-cli-relay` rule 3.
Grammar: `ChoiceCard` + `Alert` (`EssentialQuestion`), `Section fact` (`frame/Section/head.d.ts`), `FencedCodeBlock`, `Text tone="muted"`.
