# streak

One streak for the whole app, counted only on real work, to bring the learner back each day (owner: "để kích thích học và lấy chuỗi").
It encourages; it never grants experience.

## Terms
- **Meaningful action**: one of: every review item due today done; one graded attempt (Bản chất or retrieval graded, a judged practice
  submission, a graded agent or project explanation); one project run through the learner CLI and relay.
- **Active day**: an `Asia/Ho_Chi_Minh` day with at least one meaningful action.
- **Freeze**: covers one missed day.
- **Per-part counter**: each action also counts for its part, so the learner sees which parts are strong.

## Data
The producer port takes `(learner, part, kind, actionId?)` with parts essentials, review, practice, projects and incidents, with
kinds review-due-done, graded-attempt and project-run. An action counts once, when it is stored; a retry or resend of
the same action id does not count again.

## Rules
1. Page views, opening a lesson, reading, flipping a card without grading it, and sign-ins never count.
2. The weekly goal is a number of active days, default 4 (2..7).
3. One freeze is granted every Monday, a second is earned by meeting last week's goal; at most two are held. A missed day uses a held
   freeze; with none left the current streak resets to 0 and the longest stays.
4. The streak and its badges (the teacher's achievements seed) never create or verify an experience item, never count toward a path's
   done and never appear as a CV line.
5. The app never shames a broken streak and sends at most one reminder a day.

## Example
A learner who only opened three lessons today does not get the day; one who submitted a practice solution does, for the overall
streak and the practice counter.

## Don't / Instead
- Don't count a part's own streak; call the one producer port after the action is stored.
- Don't compare streaks between learners.

## Where
`be/src/modules/domain/streak/`, `be/src/modules/domain/hub/`, `be/src/features/api/hub/`

Related: [learning-program](learning-program.md), [review](review.md), [verified-experience](verified-experience.md)
