import { isIP } from "node:net"

const numbersOf = (text: string, separator: string, radix: number): ReadonlyArray<number> =>
    text.split(separator).map((part) => Number.parseInt(part, radix))

/** The number at an index; an absent one is NaN, which no range check accepts. */
const at = (list: ReadonlyArray<number>, index: number): number => Number(list[index])

/** Whether a dotted IPv4 address is in a range that is not the public internet: private, loopback, link-local, shared, documentation, benchmark, multicast or reserved. */
const isPublicV4 = (address: string): boolean => {
    const parts = numbersOf(address, ".", 10)
    const [a, b, c] = [at(parts, 0), at(parts, 1), at(parts, 2)]
    const blocked =
        a === 0 ||
        a === 10 ||
        a === 127 ||
        a >= 224 ||
        (a === 100 && b >= 64 && b <= 127) ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 0 && (c === 0 || c === 2)) ||
        (a === 192 && b === 88 && c === 99) ||
        (a === 192 && b === 168) ||
        (a === 198 && (b === 18 || b === 19)) ||
        (a === 198 && b === 51 && c === 100) ||
        (a === 203 && b === 0 && c === 113)
    return !blocked
}

const groupList = (part: string | undefined): ReadonlyArray<number> =>
    part === undefined || part === "" ? [] : numbersOf(part, ":", 16)

const v4TailOf = (octets: ReadonlyArray<number>): string =>
    `${((at(octets, 0) << 8) | at(octets, 1)).toString(16)}:${((at(octets, 2) << 8) | at(octets, 3)).toString(16)}`

/** The eight 16-bit groups of an IPv6 address, with `::` expanded and an embedded IPv4 tail turned into two groups. */
const groupsOf = (address: string): ReadonlyArray<number> => {
    const zone = address.indexOf("%")
    const bare = zone === -1 ? address : address.slice(0, zone)
    const cut = bare.lastIndexOf(":") + 1
    const tail = bare.slice(cut)
    const text = tail.includes(".") ? `${bare.slice(0, cut)}${v4TailOf(numbersOf(tail, ".", 10))}` : bare
    const [head, rest] = text.split("::")
    const left = groupList(head)
    const right = groupList(rest)
    const fill = rest === undefined ? [] : Array.from({ length: 8 - left.length - right.length }, () => 0)
    return [...left, ...fill, ...right]
}

const v4FromGroups = (high: number, low: number): string => `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`

/** Whether an IPv6 address is global unicast: mapped IPv4 follows the IPv4 rules, and 6to4, Teredo and documentation ranges are refused. */
const isPublicV6 = (address: string): boolean => {
    const groups = groupsOf(address)
    const [g0, g1, g2] = [at(groups, 0), at(groups, 1), at(groups, 2)]
    const mapped = groups.slice(0, 5).every((group) => group === 0) && at(groups, 5) === 0xffff
    if (mapped) return isPublicV4(v4FromGroups(at(groups, 6), at(groups, 7)))
    if (g0 < 0x2000 || g0 > 0x3fff) return false
    if (g0 === 0x2002) return isPublicV4(v4FromGroups(g1, g2))
    return !(g0 === 0x2001 && (g1 === 0 || g1 === 0x0db8))
}

/** Whether an IP address, as text, is on the public internet. An unreadable address is not. */
export const isPublicAddress = (address: string): boolean => {
    const version = isIP(address)
    if (version === 4) return isPublicV4(address)
    return version === 6 ? isPublicV6(address) : false
}
