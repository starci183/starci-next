# Example: one chapter of a scenario-first Bản chất

Quoted (headings moved to this page's levels, long fences cut with "…") from the content repository `starci-next-seed-standard`, branch
`content/lessons-3` at `0f8b8f0`, `raw/essentials/caching/distributed-cache/sections/2-essence/vi.md`, chapter 2. Use it for the order of
a chapter and its length; two calques of the lesson ("dấu xóa", "lượt đọc") are replaced here by the words of
[../../shared/voice.md](../../shared/voice.md) §3.2 **(đề xuất)**, and the lesson keeps them until it is rewritten; the numbers come from `.e2e/2026-11-23-essence-runs.md` of that lesson.

## The link back and the scene

← Câu 1 ở Mở đầu. Ở đó bạn chọn cách sửa; ở đây bạn ép cuộc đua xảy ra và đo nó.

Marketing đổi giá sớm để thử: ghi 199.000đ vào Postgres, rồi `DEL` key giá. Trang vẫn hiện 249.000đ thêm gần trọn một TTL. Kịch bản
`stale-after-write` dựng lại đúng cảnh đó: api-1 đọc giá rồi bị giữ 600 ms trước khi ghi cache (hook `x-lab-pause-ms`), trong lúc đó api-2
đổi giá.

## The flow with the guard off

```
:::run[Luồng 1 · Tắt version: trang hiện sai 50.000đ]{scenario="stale-after-write" guards="versioned-set"}
npx @starci/next run distributed-cache --scenario stale-after-write --guard versioned-set=off
[ledger] DB (source of truth): 199.000đ v2
[ledger] Redis product:p-1: kind=val v1 price=249.000đ
[ledger] shown 1 s after the write: 249.000đ -> wrong by 50.000đ
[ledger] that wrong price lives until the TTL ends: 33 s more
*Kết luận: Postgres đã là 199.000đ v2, nhưng Redis giữ bản v1 249.000đ, và giá sai đó còn sống thêm 33 giây.*
:::
```

## The code, then the mechanism

**Đọc code.** Khi guard tắt, đường ghi chỉ xóa key, còn đường đọc ghi cache vô điều kiện: (two fences, `src/products.ts` lines 199-200
and 123-131) … Dòng 126 đọc giá 249.000đ v1. Dòng 130 là khe hở: bất cứ thứ gì làm request khựng (GC, mạng, CPU) đều nằm ở đây.

**Cơ chế.** Cache-aside có **hai bên cùng ghi vào cache**: bên đổi giá (xóa) và bên đọc (nạp lại). Không có gì xếp thứ tự hai bên.

## The fix, the right number, the cost and the self-check

**Sửa.** Bên đổi giá không `DEL` nữa mà ghi một **tombstone** (bản ghi đánh dấu đã xóa, kèm version mới) **(đề xuất)**: (`src/products.ts` lines 192-197), then
"Luồng 2 · Bật version: lệch 0đ" with `wrong by 0đ`.

**Cái giá.** Sau mỗi lần đổi giá, request đọc kế tiếp phải xuống Postgres một lần (tombstone tính như cache miss). **(đề xuất)**

**Tự kiểm tra.** Nếu đổi `DEL` thành "xóa hai lần, cách nhau 500 ms" (delayed double delete), cuộc đua ở Luồng 1 có hết không? (answer
folded in `:::panel{title="Đáp án"}`)
