/** Whether a problem is beyond the free ones of its pattern: the free ones are the first `freePerPattern` by order. */
export const isBeyondFree = (rank: number, freePerPattern: number): boolean => rank >= freePerPattern
