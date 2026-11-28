"use client"

import { useEffect, useRef } from "react"

/** The brand violets and the warm accents the burst draws with (media.yaml bases.explainer: violet #633AE6). */
const COLORS: ReadonlyArray<string> = ["#633AE6", "#8B6CF0", "#C4B5FD", "#F59E0B", "#10B981", "#F472B6"]

/** How many pieces one burst throws, and how long it lasts before the canvas is removed. */
const PIECES = 160
const DURATION_MS = 2600

/** One piece of paper: where it is, how it moves and how it turns. */
type Piece = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    angle: number
    spin: number
    color: string
}

/** A burst from the bottom corners toward the middle of the screen, the pieces falling back under gravity. */
const piecesOf = (width: number, height: number): Piece[] =>
    Array.from({ length: PIECES }, (_, index) => {
        const fromLeft = index % 2 === 0
        const speed = 9 + Math.random() * 9
        const angle = (fromLeft ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7
        return {
            x: fromLeft ? width * 0.1 : width * 0.9,
            y: height,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed * 1.6,
            size: 6 + Math.random() * 6,
            angle: Math.random() * Math.PI,
            spin: (Math.random() - 0.5) * 0.3,
            color: COLORS[index % COLORS.length] ?? "#633AE6",
        }
    })

/** Throws one burst on a full-screen canvas above the page, then removes the canvas. Nothing under reduced motion. */
const burst = (): void => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const canvas = document.createElement("canvas")
    canvas.setAttribute("aria-hidden", "true")
    canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000"
    const ratio = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio
    document.body.appendChild(canvas)
    const context = canvas.getContext("2d")
    if (context === null) {
        canvas.remove()
        return
    }
    context.scale(ratio, ratio)
    const pieces = piecesOf(window.innerWidth, window.innerHeight)
    const started = performance.now()
    const frame = (now: number): void => {
        const elapsed = now - started
        context.clearRect(0, 0, window.innerWidth, window.innerHeight)
        // The last third fades out, so the pieces leave instead of vanishing.
        context.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / (DURATION_MS / 3)))
        for (const piece of pieces) {
            piece.vy += 0.35
            piece.vx *= 0.99
            piece.x += piece.vx
            piece.y += piece.vy
            piece.angle += piece.spin
            context.save()
            context.translate(piece.x, piece.y)
            context.rotate(piece.angle)
            context.fillStyle = piece.color
            context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2)
            context.restore()
        }
        if (elapsed < DURATION_MS) window.requestAnimationFrame(frame)
        else canvas.remove()
    }
    window.requestAnimationFrame(frame)
}

/** Props for {@link Confetti}. */
type ConfettiProps = {
    /** The moment to celebrate: the burst fires when this turns true while the page is open, never for a page opened already true. */
    readonly when: boolean
}

/**
 * LEAF - `Confetti` (owner 2026-11-28: "done thì bắn confetti"): one burst of paper over the page when something the learner waited for
 * finishes (the lab built on their machine). It draws nothing in the tree; the burst is a canvas above the page that removes itself.
 */
export const Confetti = ({ when }: ConfettiProps) => {
    const previous = useRef(when)
    useEffect(() => {
        if (when && !previous.current) burst()
        previous.current = when
    }, [when])
    return null
}
