---
title: Bản chất / Bài học · phần 3 Kịch bản
route: /essentials/[topic]/[lesson]?part=scenarios
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=scenarios` (`&scenario=<id>` mở thẳng một kịch bản). Phần 3: chạy kịch bản trên máy mình bằng `starci-next`, kết quả về qua relay (task `lesson:<bài>`, check id = id kịch bản) và hiện ở đây; trang đọc lại mỗi 2 giây khi có lần chạy đang dở, 10 giây khi rảnh. Đỏ thì "Vì sao sai" và "Hỏi AI sửa"; người học chẩn đoán và chỉ đạo AI, không gõ code. Cần Premium. Code: `EssentialScenarios` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, `scenariosOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`, SWR `useQueryLessonScenarioRunsSwr`.

## Danh sách kịch bản (trạng thái lần chạy mới nhất)

Vì sao: mỗi kịch bản một hàng: tên, lỗi nó gây ra, chip Chưa chạy / Đang chạy / Xanh / Đỏ / "Đỏ do tắt guard" (đỏ khi tắt guard là bằng chứng luyện tập, không phải lỗi); hàng đang chọn được đánh dấu; meta "x/y kịch bản xanh".
Luật: COOK 2026-11-17 phần 3; concept `learner-cli-relay` rule 5 (tag lesson+scenario).
Grammar: `Section kind="list" meta items[{ title, description, badges, onPress, state }]` (`frame/Section/index.d.ts`, `surfaceCardData.d.ts`).

## Kịch bản đang chọn: lệnh, kết quả mong đợi, kết quả từ máy

Vì sao: lỗi được tiêm, khối lệnh `starci-next run <bài> --scenario <id>` và mỗi guard một dòng `--guard <g>=off`, dòng "Hệ thống đúng sẽ cho", rồi Terminal với output và ledger CLI gửi lên (đang chạy thì skeleton).
Luật: COOK 2026-11-17 phần 3 ("command, expected output … run via starci-next run|check … results stream to the app via the relay"); SCENARIO-CONTRACT §5.
Grammar: `Section fact meta` (`frame/Section/head.d.ts`), `FencedCodeBlock` (`frame/MarkdownArticle/index.d.ts`), `Terminal lines title isLoading` (`branch/Terminal/index.d.ts`).

## Vì sao sai + Hỏi AI sửa (chỉ khi đỏ)

Vì sao: hộp negative với thông điệp `[invariant:…]` CLI gửi về, luật bị phá (mã + tên) và gợi ý; dưới đó mục "Hỏi AI sửa": lời nhắc sẵn để dán vào Claude/ChatGPT/agent IDE (nêu id kịch bản, luật bị phá, dùng StarCi MCP `my_runs`/`read_file`), và lệnh `starci-next check` để check lại.
Luật: owner pivot 2026-11-17 ("fix = ask your AI … then starci-next check judges"); COOK phần 3 ("red -> Vì sao sai (invariant broken + hint)").
Grammar: `Alert tone="negative" description` (`composite/Alert/index.d.ts`), `Section headingLevel={3} description` (`frame/Section/index.d.ts`), `FencedCodeBlock` (copy).
