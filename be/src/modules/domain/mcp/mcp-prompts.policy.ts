/** The rules every prompt hands the learner's AI, stated once: what stays out of reach and what the AI may do. */
const GROUND_RULES_VI = [
    "Quy tắc:",
    "- Chỉ dùng công cụ của StarCi: lesson outline/section, read_file, search_code, search_lesson, list_scenarios, my_runs, invariants, request_run.",
    "- Bài test ẩn, đáp án, bằng chứng mong đợi của rubric và bài nộp mẫu không có ở đây và không được đoán. Nếu học viên hỏi, nói rõ là không có.",
    "- Bạn được phép sửa code cục bộ của học viên khi họ đồng ý; đừng sửa kịch bản, đừng tắt guard hay làm yếu kiểm tra chỉ để chuyển xanh.",
    "- Kết quả chỉ tính khi chạy lại bằng request_run; học viên xác nhận lệnh trên máy của họ.",
].join("\n")

const GROUND_RULES_EN = [
    "Rules:",
    "- Use only the StarCi tools: lesson outline/section, read_file, search_code, search_lesson, list_scenarios, my_runs, invariants, request_run.",
    "- Hidden tests, answer keys, the rubric's expected evidence and sample submissions are not available here and must never be guessed. If asked, say they are not available.",
    "- You may edit the learner's local code once they agree; never edit the scenario, switch a guard off or weaken a check just to turn it green.",
    "- A result counts only after a re-run through request_run; the learner confirms the command on their own machine.",
].join("\n")

/** The language a prompt is written in. */
export type McpPromptLocale = "vi" | "en"

const rulesOf = (locale: McpPromptLocale): string => (locale === "vi" ? GROUND_RULES_VI : GROUND_RULES_EN)

/**
 * `fix_scenario`: walks the learner's AI through one red scenario in four steps (diagnose, explain the invariant, propose a
 * change, check by a re-run) and says where each step stops and asks the learner.
 */
export const fixScenarioPrompt = (locale: McpPromptLocale, lesson: string, scenario: string): string =>
    locale === "vi"
        ? [
              `Bạn đang giúp học viên sửa kịch bản "${scenario}" của bài "${lesson}". Làm đúng bốn bước, dừng lại hỏi học viên ở cuối bước 3 và bước 4.`,
              "",
              "1. Chẩn đoán",
              `   - Gọi my_runs(lesson="${lesson}") và lấy lần chạy gần nhất của "${scenario}". Nếu chưa có lần nào hoặc đã cũ, gọi request_run rồi nhờ học viên xác nhận trên máy, sau đó gọi my_runs lại.`,
              "   - Đọc log: tìm câu kiểm tra đầu tiên đỏ và số liệu trước/sau (sổ tiền, trạng thái). Dùng list_scenarios để biết lỗi được bơm và guard nào đang tắt.",
              "   - Dùng search_code hoặc search_lesson (semantic) rồi read_file để tìm đoạn code chịu trách nhiệm. Nói rõ bạn đã đọc file nào, dòng nào.",
              "2. Giải thích luật",
              "   - Gọi invariants và nêu luật bị phá bằng lời thường: luật đó giữ điều gì, nằm ở đâu trong code, vì sao lỗi này phá nó. Chưa đụng vào code ở bước này.",
              "   - Nếu luật chưa được mở, đừng đoán tên luật; mô tả hiện tượng và gợi ý học viên chạy kịch bản liên quan.",
              "3. Đề xuất thay đổi",
              "   - Đưa ra thay đổi nhỏ nhất làm luật được giữ lại, dạng diff trên code cục bộ của học viên, kèm lý do. Hỏi học viên có đồng ý để bạn áp dụng không.",
              "4. Kiểm tra",
              `   - Sau khi áp dụng, gọi request_run(lesson="${lesson}", scenario="${scenario}") không tắt guard nào, nhờ học viên xác nhận lệnh trên máy, rồi gọi my_runs và so sánh trước/sau.`,
              "   - Còn đỏ thì quay lại bước 1 với log mới (tối đa 3 vòng), rồi tóm tắt cho học viên điều họ cần hiểu.",
              "",
              rulesOf(locale),
          ].join("\n")
        : [
              `You are helping the learner fix the scenario "${scenario}" of the lesson "${lesson}". Follow exactly four steps and stop to ask the learner at the end of steps 3 and 4.`,
              "",
              "1. Diagnose",
              `   - Call my_runs(lesson="${lesson}") and take the latest run of "${scenario}". If there is none or it is stale, call request_run, ask the learner to confirm on their machine, then call my_runs again.`,
              "   - Read the log: find the first failing check and the before/after numbers (ledger, state). Use list_scenarios for the injected fault and the guards.",
              "   - Use search_code or search_lesson (semantic) and then read_file to find the responsible code. Say which files and lines you read.",
              "2. Explain the invariant",
              "   - Call invariants and state the broken law in plain words: what it protects, where the code keeps it, why this fault breaks it. Do not touch code yet.",
              "   - If the law is not revealed yet, do not guess its name; describe the symptom and suggest running the related scenario.",
              "3. Propose a change",
              "   - Give the smallest change that restores the law as a diff on the learner's local code, with the reason. Ask whether to apply it.",
              "4. Check",
              `   - After applying it, call request_run(lesson="${lesson}", scenario="${scenario}") with no guard switched off, ask the learner to confirm on their machine, then call my_runs and compare before and after.`,
              "   - If it is still red, go back to step 1 with the new log (at most 3 rounds), then summarise what the learner should understand.",
              "",
              rulesOf(locale),
          ].join("\n")

/** `explain_invariant`: where a law lives in the code, from the code and the revealed invariants only. */
export const explainInvariantPrompt = (locale: McpPromptLocale, lesson: string, invariant: string): string =>
    locale === "vi"
        ? [
              `Giải thích luật "${invariant}" của bài "${lesson}" nằm ở đâu trong code.`,
              "Gọi invariants để lấy phát biểu và vị trí; dùng read_file mở đúng đoạn, trích vài dòng và giải thích vì sao đoạn đó giữ luật. Nếu luật chưa mở, nói vậy và gợi ý kịch bản cần chạy.",
              "",
              rulesOf(locale),
          ].join("\n")
        : [
              `Explain where the law "${invariant}" of the lesson "${lesson}" lives in the code.`,
              "Call invariants for its statement and location; open the exact part with read_file, quote a few lines and explain why they keep the law. If the law is not revealed, say so and suggest the scenario to run.",
              "",
              rulesOf(locale),
          ].join("\n")

/** `why_scenario_red`: read the learner's own run and say why it is red, without changing anything. */
export const whyScenarioRedPrompt = (locale: McpPromptLocale, lesson: string, scenario: string): string =>
    locale === "vi"
        ? [
              `Vì sao kịch bản "${scenario}" của bài "${lesson}" đỏ trên máy tôi?`,
              "Gọi my_runs, đọc log của lần chạy gần nhất và list_scenarios để biết lỗi được bơm. Chỉ ra câu kiểm tra đầu tiên đỏ, luật bị phá (invariants nếu đã mở) và đoạn code liên quan. Không sửa gì; nếu học viên muốn sửa, chuyển sang quy trình fix_scenario.",
              "",
              rulesOf(locale),
          ].join("\n")
        : [
              `Why is the scenario "${scenario}" of the lesson "${lesson}" red on my machine?`,
              "Call my_runs, read the latest run's log, and list_scenarios for the injected fault. Point at the first failing check, the law broken (invariants if revealed) and the related code. Change nothing; if the learner wants a fix, switch to the fix_scenario flow.",
              "",
              rulesOf(locale),
          ].join("\n")
