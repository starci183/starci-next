/** The Vietnamese question of the sample interview: where a piece of logic belongs. */
export const LAYER_QUESTION_VI = "Logic này thuộc tầng nào?"

/** The Vietnamese ideal answer of the sample question. */
export const LAYER_IDEAL_VI = "Đặt trong service."

/** The Vietnamese follow-up of the sample question. */
export const LAYER_FOLLOW_UP_VI = "Vì sao tầng đó?"

/** The first Vietnamese hint of the sample question. */
export const LAYER_HINT_ONE_VI = "Gợi ý một"

/** The second Vietnamese hint of the sample question. */
export const LAYER_HINT_TWO_VI = "Gợi ý hai"

/** The Vietnamese title of the sample bank. */
export const BANK_TITLE_VI = "Ngân hàng"

/** A Vietnamese file title written to disk by the directory spec. */
export const FILE_TITLE_VI = "tiêu đề"

/** The text a skipped answer is stored under in a graded transcript. */
export const SKIPPED_ANSWER_VI = "(bỏ qua)"

/** The scripted text stored for a skipped question. */
export const SKIPPED_LINE_VI = "(bỏ qua câu này)"

/** A short thanks the interviewer ends on. */
export const THANKS_VI = "Cảm ơn"

/** The words of the scripted closing line that name the last question. */
export const LAST_QUESTION_WORDS_VI = "câu hỏi cuối cùng"

/** The Vietnamese heading the bank-draft spec swaps into a body file. */
export const BOTTOM_LINE_VI = "Chốt"

/** The ideal-answer sentence the bank-draft spec swaps into a body file. */
export const CACHE_IDEAL_VI = "Hệ thống phải làm việc thật rồi ghi kết quả vào cache store trong bộ nhớ kèm TTL"

/** A prompt whose parenthesis spells out the expected points. */
export const HINTED_PROMPT_VI =
    "Hãy giải thích cache hoạt động ra sao trong lần gọi đầu (MISS — hệ thống phải làm việc thật rồi ghi kết quả vào cache store trong bộ nhớ kèm TTL) và lần gọi thứ hai."

/** The stem the hinted prompt is reduced to. */
export const HINTED_STEM_VI = "Hãy giải thích cache hoạt động ra sao trong lần gọi đầu và lần gọi thứ hai."

/** A prompt that repeats a long run of the ideal answer. */
export const COPIED_PROMPT_VI =
    "Nói về chuyện sau: hệ thống phải làm việc thật rồi ghi kết quả vào cache store trong bộ nhớ kèm một TTL nhỏ để lần gọi thứ hai trả thẳng ngay từ bộ nhớ không tính lại nữa."

/** The prompt of a bank question as the teacher wrote it: the expected points sit in parentheses and after a dash. */
export const AUTHORED_PROMPT_VI =
    "Trong buổi phỏng vấn, người ta đưa bạn xem một phép đo: cùng một endpoint đọc dữ liệu, lần gọi đầu tiên mất khoảng một giây, lần gọi thứ hai chỉ còn vài mili-giây. Hãy giải thích thành lời cơ chế đứng sau con số này: lần gọi đầu tiên đã xảy ra chuyện gì (MISS — hệ thống phải làm việc thật, tính toán nặng hoặc round-trip xuống database, rồi lưu kết quả vào một cache store trong bộ nhớ kèm TTL), lần gọi thứ hai thì sao (HIT — trả thẳng từ bộ nhớ, không tính lại, không round-trip xuống DB), và bạn KHÔNG có được đảm bảo gì từ bản sao nhanh đó — nó có thể trở nên cũ (stale) trong khoảng thời gian TTL, và có thể bị evict hoặc mất hoàn toàn."

/** The ideal answer to the authored prompt. */
export const AUTHORED_IDEAL_VI =
    "Lần gọi đầu tiên là một cache MISS: hệ thống kiểm tra cache, không thấy gì, phải làm việc thật (tính toán nặng hoặc query xuống database), rồi ghi kết quả vào cache store trong bộ nhớ kèm một TTL. Lần gọi thứ hai là một HIT: kết quả được trả thẳng từ bộ nhớ, bỏ qua cả bước tính toán lẫn round-trip xuống DB. Bản sao có thể trở nên cũ trong khoảng thời gian TTL và có thể bị evict hoặc mất hoàn toàn."

/** The checklist items of the authored prompt. */
export const AUTHORED_CHECKLIST_VI: ReadonlyArray<string> = [
    "Lần gọi đầu tiên là cache MISS: hệ thống phải làm việc thật rồi ghi kết quả vào cache store trong bộ nhớ kèm TTL",
    "Lần gọi thứ hai là HIT: trả thẳng từ bộ nhớ, bỏ qua tính toán và round-trip xuống DB",
]

/** Clauses of the stem that must survive the removal of the hints. */
export const AUTHORED_KEPT_CLAUSES_VI: ReadonlyArray<string> = [
    "lần gọi đầu tiên đã xảy ra chuyện gì",
    "lần gọi thứ hai thì sao",
    "bạn KHÔNG có được đảm bảo gì từ bản sao nhanh đó",
]

/** A prompt with a parenthesis that spells out the points and a comma clause that follows. */
export const PARENTHESIS_PROMPT_VI =
    "Giải thích vì sao lần gọi đầu tiên chậm (MISS — hệ thống phải làm việc thật, tính toán nặng hoặc round-trip xuống database ghi vào cache), và lần hai nhanh hơn?"

/** The stem the parenthesis prompt is reduced to. */
export const PARENTHESIS_STEM_VI = "Giải thích vì sao lần gọi đầu tiên chậm, và lần hai nhanh hơn?"

/** A short question followed by a dash tail that spells out the answer; the stem keeps the question only. */
export const DASH_QUESTION_VI = "Một câu hỏi"

/** The dash tail that spells out the answer. */
export const DASH_TAIL_VI = "nó có thể trở nên cũ trong khoảng thời gian TTL và có thể bị evict hoặc mất hoàn toàn"

/** A short parenthesis and a short tail, neither of which is an answer. */
export const SHORT_PARENTHESIS_VI = "Hãy giải thích (MISS và HIT) cho tôi — bộ nhớ."

/** A prompt that lists the problems a strong answer names. */
export const DI_PROMPT_VI =
    "Hãy giải thích cho họ nghe: cách viết này gây ra những vấn đề gì khi hệ thống lớn dần (khó test, khó đổi implementation, mất tính dùng chung, thứ tự khởi tạo mong manh), và việc để một IoC container tạo phụ thuộc đổi lại được điều gì?"

/** The graded texts of the DI prompt. */
export const DI_GRADED_VI: ReadonlyArray<string> = [
    "Tạo phụ thuộc bằng new trong constructor làm code khó test, khó đổi implementation, mất tính dùng chung và thứ tự khởi tạo mong manh khi hệ thống lớn dần",
    "IoC container tạo và ghép nối phụ thuộc giúp dễ test, dễ đổi implementation và dùng chung một instance",
]

/** The stem the DI prompt is reduced to. */
export const DI_STEM_VI =
    "Hãy giải thích cho họ nghe: cách viết này gây ra những vấn đề gì khi hệ thống lớn dần, và việc để một IoC container tạo phụ thuộc đổi lại được điều gì?"

/** The prefix of a prompt that leaks a checklist item. */
export const LEAK_PREFIX_VI = "Hãy nói về: "

/** A short phrase shared with the ideal answer, which is not a giveaway. */
export const SHARED_PHRASE_VI = "lần gọi thứ hai thì sao"

/** A prompt that shares nothing with the ideal answer. */
export const UNRELATED_PROMPT_VI = "Một câu hỏi hoàn toàn khác về hạ tầng"

/** A prompt shorter than the giveaway run. */
export const SHORT_PROMPT_VI = "ngắn"

/** Words of the DI prompt that the stem must no longer contain. */
export const DI_REMOVED_WORDS_VI: RegExp = /khó test|mong manh|dùng chung/u
