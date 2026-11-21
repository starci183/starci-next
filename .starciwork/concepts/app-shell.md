# app-shell

The shell and navigation mirror the NIVO console, so the two feel like one product family with one navigation (owner). The plan and
the upgrade live in the top bar's lockup line and the avatar menu; the sidebar is navigation only.

## Terms
- **Top bar**: the Grammar TopBar over the whole width, with the brand lockup at the start and, at the end, the round locale button,
  the theme switch and the account avatar menu.
- **Lockup line**: the muted line under the brand: the learner role and the plan ("Học viên · Chưa có Premium").
- **Sidebar**: white, not full height, under the top bar; groups of destinations, no footer.

## Rules
1. The sidebar sits under the top bar, never full height beside it.
2. The VI/EN switch is the round icon button with a dropdown (`LocaleSwitch`), a rule of the whole Grammar; it is never a pill or
   chips and never redrawn.
3. Signed out, the account slot is the guest avatar; its "Đăng nhập" item opens the sign-in modal in place (email and password,
   Google when offered). There is no visible sign-in button, and the item never navigates to `/sign-in`.
4. The plan sits in the lockup line. The avatar menu carries "Nâng cấp Premium" without Premium and "Gói của bạn" with it, linking to
   the Premium page; its identity row shows the plan. There is no sidebar footer, plan chip or upgrade button elsewhere.
5. The streak lives only in the aside of the Học page, never in the header.
6. A bell comes only through the TopBar `customButtons` slot, as NIVO wires its own; until then the header has no bell.
7. The status dot and chip are exactly NIVO's (Badge isDot as it is); no hollow-ring variant, no app-only status component.

## Example
A signed-out visitor opens the avatar menu, presses "Đăng nhập", and the modal opens over the same page; after signing in the
session refreshes, the lockup reads "Học viên · Chưa có Premium", and the menu offers "Nâng cấp Premium".

## Don't / Instead
- Don't add a "Xem Premium" footer to the sidebar; put the plan in the lockup and the menu.
- Don't draw a streak chip or bell in the header; use the Học aside and `customButtons`.

## Where
`fe/apps/app/src/features/layouts/`, `fe/apps/app/src/components/blocks/AppHeader/`, `fe/apps/app/src/components/blocks/AppSidebar/`,
`fe/apps/app/src/components/blocks/LocaleSwitch/`, `fe/apps/app/src/components/blocks/LearnHub/`

Related: [premium](premium.md), [identity](identity.md), [surface-layering](surface-layering.md), [theme-and-type](theme-and-type.md)
