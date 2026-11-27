// Writes <concept>.prompt.yaml (and <concept>.prompt.txt for codex) from bases.explainer of media.yaml plus each subject.
import { readFileSync, writeFileSync } from "node:fs"
import { parse, stringify } from "file:///D:/Repositories/starci-next-data/node_modules/yaml/dist/index.js"
const base = parse(readFileSync("../../../.starcistacks/brand/media.yaml", "utf8")).bases.explainer
const canvas = "Canvas: 1672x941 pixels, landscape."
const subjects = {
  "idempotency-key": `Title: "Idempotency key". Description: "orders gửi lại bao nhiêu lần, payments vẫn chỉ trừ tiền một lần".
Actors, left to right: a helper at a small desk with a laptop, label "orders (backend)"; a helper behind a counter, label "payments", with an open ledger beside it labelled "bảng khóa" whose one row reads "A → đã trừ 100k"; under the counter a wallet labelled "ví: trừ 1 lần" with a green check.
Steps: 1 (violet arrow from orders to payments, carrying an envelope with a violet key tag "A"): "trừ tiền · khóa A". 2 (violet, payments writes into the ledger): "ghi khóa + câu trả lời". 3 (grey dashed arrow from payments back to orders, broken in the middle by a red zigzag): "câu trả lời rớt". 4 (violet arrow from orders to payments, the same envelope with the same key tag "A"): "gửi lại · khóa A". 5 (green arrow from the ledger back to orders): "khóa đã có → trả kết quả cũ".
Checklist: "Mỗi lệnh một khóa", "Lưu khóa cùng câu trả lời", "Gửi lại → trả kết quả cũ".`,
  "saga": `Title: "Saga". Description: "Một bước hỏng thì các bước đã xong được bù lại, đơn không dở dang".
Actors: on the left a browser window on a laptop, label "frontend". In the middle a helper at a desk with a small notebook labelled "nhật ký các bước", label "orders". On the right, stacked top to bottom, three helpers each behind a small counter: "payments", "stock", "notify".
Steps: 1 (violet arrow from frontend to orders): "POST /orders". 2 (violet arrow from orders to payments, payments shows a small green check): "trừ tiền". 3 (violet arrow from orders to stock, ending at a red cross on stock's counter): "giữ hàng · hết hàng". 4 (green arrow from orders back to payments, curved on the right side of the first one): "bù: hoàn tiền". 5 (green arrow from orders back to frontend): "backend trả: đơn huỷ, đã hoàn tiền". The notify counter stays grey and quiet with a small grey tag "không gửi email".
Checklist: "Mỗi bước có một bước bù", "Ghi nhật ký trước khi gọi", "Bước không gỡ được để cuối".`,
  "transaction-acid": `Title: "Transaction (ACID)". Description: "Năm câu ghi của một đơn: hoặc ghi đủ cả năm, hoặc không ghi gì".
Actors: on the left a browser window on a laptop, label "frontend". In the middle a helper at a desk, label "orders (backend)". On the right a large light-grey database cylinder labelled "Postgres"; in front of it a violet-outlined box labelled "một transaction" holding five stacked rows labelled, top to bottom, "đơn", "dòng hàng", "lượt dùng mã", "ví", "kho".
Steps: 1 (violet arrow from frontend to orders): "POST /orders". 2 (violet arrow from orders into the transaction box): "BEGIN · ghi 5 câu". 3 (a red cross on the last row "kho"): "kho hết hàng". 4 (green arrow from the transaction box back to orders; the five rows are drawn faded and struck through together): "ROLLBACK: cả 5 câu cùng huỷ". 5 (green arrow from orders back to frontend): "409: hết hàng, không có đơn dở".
Checklist: "Một đơn, một transaction", "Lỗi ở đâu cũng huỷ hết", "Luật nằm trong ràng buộc của bảng".`,
}
for (const [name, subject] of Object.entries(subjects)) {
  const prompt = `${base.text}\n\n${canvas}\n\n${subject}`
  writeFileSync(`${name}.prompt.txt`, `Generate one image with your image generation tool and save it as ${name}.png in the current folder. Use the attached picture only as a style reference for line, colour and shading.\n\n${prompt}\n`)
  writeFileSync(`${name}.prompt.yaml`, `# Explainer base v${base.version} (owner 2026-11-27): media.yaml bases.explainer, then the canvas and the subject.\n` + stringify({
    basePrompt: { name: "explainer", version: base.version }, subject, prompt, output: `statics/art/explainers/${name}.webp`,
    model: "codex image generation (codex-cli 0.164.0), style picture statics/art/v2/lesson-outbox-idempotency.webp attached",
    seed: null, ratio: "16:9", aiGenerated: true, approvedBy: "pending-owner" }, { lineWidth: 140 }))
}
