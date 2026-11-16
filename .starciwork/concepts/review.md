# review

Ôn tập is one daily queue across everything the learner has met: the teacher's flashcards, recalled before the flip and self-graded,
and the retrieval questions of finished Bản chất lessons, answered in writing and graded by rubric.

## Terms
- **Card**: a flashcard of the teacher's decks (grouped by outcome track); free when the teacher marked it `isPremium: false`.
- **Retrieval item**: a Bản chất retrieval activity that falls due at lesson completion + its authored `afterDays` (1, 7, 21).
- **Ladder**: the card schedule, steps 1, 3, 7, 14, 30, 60, 120, 180 days.
- **Self-grade**: Quên, Khó, Nhớ, Dễ. *Not to confuse with* `/review-queue`, the teacher's experience queue ([verified-experience](verified-experience.md)).

## Rules
1. The learner answers before the answer appears: a card's answer, cloze term or rubric is in no payload until the flip or the submit.
2. A self-grade or written answer is stored before the next item shows or any grading runs; a resend with the same revision moves the
   item once.
3. Quên returns to step 0 and the card comes back at the end of today's session; Khó stays; Nhớ moves one step; Dễ moves two. The
   scheduler sits behind one interface so FSRS can replace the ladder once there is history.
4. A retrieval result below level 2 schedules one extra attempt after 3 days; level 2 closes the item. A written retrieval answer may
   raise the lesson's understood level, never lower it.
5. A cloze card may be checked by picking the hidden term among the authored choices; that check is deterministic and calls no AI.
6. A free learner reviews the free cards of every deck and sees the rest as locked (`REVIEW_PREMIUM_REQUIRED`, no AI call). Premium adds
   every card, the retrieval items, the automatic queue from studied lessons and AI grading.
7. Due dates are `Asia/Ho_Chi_Minh` calendar days; overdue items sort first, oldest first. The daily goal defaults to 10 items (5..50).
8. Encouragement, not pressure: at most one reminder a day, and a broken streak is never shamed.

## Example
A card answered "Khó" on step 7 stays on 7 days; a retrieval answer at level 1 after the 7-day item returns 3 days later.

## Don't / Instead
- Don't generate cards with AI or add leaderboards; review the teacher's decks and the learner's own lessons.
- Don't keep a second streak in review; record a review-due-done action on the one streak ([streak](streak.md)).

## Where
`be/src/modules/domain/review/`, `be/src/features/api/review/`, `fe/apps/app/src/app/[locale]/(app)/review/`

Related: [essentials](essentials.md), [streak](streak.md), [premium](premium.md), [ai-teacher](ai-teacher.md)
