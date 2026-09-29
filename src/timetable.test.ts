import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isHoliday, isRouteAvaliable } from "./timetable";

describe("isHoliday", () => {
  it("returns true when the YYYYMMDD key is present", () => {
    expect(isHoliday(["20260701"], new Date("2026-07-01T04:00:00Z"))).toBe(true);
  });

  it("returns false for a normal weekday", () => {
    expect(isHoliday(["20260701"], new Date("2026-07-02T04:00:00Z"))).toBe(
      false
    );
  });

  it("pads single-digit months and days", () => {
    expect(isHoliday(["20260105"], new Date(2026, 0, 5))).toBe(true);
  });

  it("returns false for an empty holiday list", () => {
    expect(isHoliday([], new Date("2026-07-01T04:00:00Z"))).toBe(false);
  });
});

describe("isRouteAvaliable", () => {
  // every day of the week is a valid service day (index 0 === Sunday)
  const everyDay = { MON: ["1", "1", "1", "1", "1", "1", "1"] } as never;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("treats a route without frequency data as always available", () => {
    expect(isRouteAvaliable("1A", null, false, everyDay)).toBe(true);
  });

  it("returns true when the current time is inside the service window", () => {
    // 2026-07-01 is a Wednesday. 10:00 HKT === 02:00 UTC.
    vi.setSystemTime(new Date("2026-07-01T02:00:00Z"));
    const freq = { MON: { "0800": ["2200", "10"] } } as never;
    expect(isRouteAvaliable("1A", freq, false, everyDay)).toBe(true);
  });

  it("returns true at the very last minute of the service window", () => {
    // 21:59 HKT === 13:59 UTC
    vi.setSystemTime(new Date("2026-07-01T13:59:00Z"));
    const freq = { MON: { "0800": ["2200", "10"] } } as never;
    expect(isRouteAvaliable("1A", freq, false, everyDay)).toBe(true);
  });

  it("returns false once the service window has closed", () => {
    // 23:30 HKT === 15:30 UTC, past 22:00 plus the 60 minute grace period
    vi.setSystemTime(new Date("2026-07-01T15:30:00Z"));
    const freq = { MON: { "0800": ["1200", "10"] } } as never;
    expect(isRouteAvaliable("1A", freq, false, everyDay)).toBe(false);
  });

  it("returns false before the first departure of the day", () => {
    // 05:00 HKT === 21:00 UTC on 2026-06-30
    vi.setSystemTime(new Date("2026-06-30T21:00:00Z"));
    const freq = { MON: { "0900": ["2200", "10"] } } as never;
    expect(isRouteAvaliable("1A", freq, false, everyDay)).toBe(false);
  });

  it("fails open (true) when the service id is unknown", () => {
    vi.setSystemTime(new Date("2026-07-01T02:00:00Z"));
    const freq = { UNKNOWN_SERVICE: { "0800": ["2200", "10"] } } as never;
    expect(isRouteAvaliable("1A", freq, false, everyDay)).toBe(true);
  });
});
