"use client"

import { create, type StoreApi, type UseBoundStore } from "zustand"

/** The sign-in modal's local UI state; it carries no session or server data. */
type SignInModalState = {
    readonly isOpen: boolean
    readonly setOpen: (isOpen: boolean) => void
}

/** One store, shared by the header's sign-in entry and the modal that opens on it. */
export const useSignInModalStore: UseBoundStore<StoreApi<SignInModalState>> = create<SignInModalState>()((set) => ({
    isOpen: false,
    setOpen: (isOpen) => set({ isOpen }),
}))
