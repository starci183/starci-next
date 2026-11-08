import { Test } from "@nestjs/testing"

import { isPublicAddress } from "./probe-address.policy"

const POLICY: unique symbol = Symbol("project.probe-address-policy")
const policies = { isPublicAddress }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

describe("isPublicAddress", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it.each([
        "8.8.8.8",
        "1.1.1.1",
        "93.184.216.34",
        "172.32.0.1",
        "100.63.0.1",
        "100.128.0.1",
        "198.20.0.1",
        "203.0.114.1",
        "192.0.3.1",
        "192.88.98.1",
    ])("accepts the public IPv4 %s", (address) => {
        expect(subject.isPublicAddress(address)).toBe(true)
    })

    it.each([
        "0.0.0.0",
        "10.1.2.3",
        "127.0.0.1",
        "100.64.0.1",
        "100.127.255.255",
        "169.254.169.254",
        "172.16.0.1",
        "172.31.255.255",
        "192.0.0.1",
        "192.0.2.1",
        "192.88.99.1",
        "192.168.1.1",
        "198.18.0.1",
        "198.19.255.255",
        "198.51.100.7",
        "203.0.113.9",
        "224.0.0.1",
        "255.255.255.255",
    ])("refuses the non-public IPv4 %s", (address) => {
        expect(subject.isPublicAddress(address)).toBe(false)
    })

    it.each(["2606:4700:4700::1111", "2606:4700:4700:0:0:0:0:1111", "2a00:1450:4001:81b::200e", "2002:808:808::1"])(
        "accepts the global IPv6 %s",
        (address) => {
            expect(subject.isPublicAddress(address)).toBe(true)
        },
    )

    it.each([
        "::",
        "::1",
        "fe80::1",
        "fc00::1",
        "fd12:3456::1",
        "ff02::1",
        "2001:db8::1",
        "2001::1",
        "2002:7f00:1::1",
        "2002:a00:1::1",
        "::ffff:127.0.0.1",
        "::ffff:7f00:1",
        "::ffff:10.0.0.1",
        "fe80::1%eth0",
        "64:ff9b::808:808",
    ])("refuses the non-public IPv6 %s", (address) => {
        expect(subject.isPublicAddress(address)).toBe(false)
    })

    it("accepts a mapped public IPv4 and refuses a text that is not an address", () => {
        expect(subject.isPublicAddress("::ffff:8.8.8.8")).toBe(true)
        expect(subject.isPublicAddress("example.com")).toBe(false)
        expect(subject.isPublicAddress("")).toBe(false)
    })
})
