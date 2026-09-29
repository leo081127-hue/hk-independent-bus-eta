import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import type { ReactNode } from "react";

// External dependency under test: never hit the network in unit tests.
vi.mock("hk-bus-eta", () => ({
  fetchEtas: vi.fn(),
}));

// i18n lookup is irrelevant to the polling logic.
vi.mock("./useTranslation", () => ({
  __esModule: true,
  default: () => "en",
}));

import { fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import DbContext from "../context/DbContext";
import { useEtas } from "./useEtas";

const mockedFetchEtas = vi.mocked(fetchEtas);

const routeList = {
  "1A": {
    co: ["kmb"],
    stops: { kmb: ["stop1", "stop2"] },
    dest: { zh: "終點站", en: "Terminus" },
    bound: "O",
    nlbId: 0,
    gtfsId: "",
    fares: [],
    faresHoliday: [],
  },
};

const stopList = {
  stop1: { name: { zh: "站點1", en: "Stop 1" } },
  stop2: { name: { zh: "站點2", en: "Stop 2" } },
};

const makeDbValue = () =>
  ({
    db: {
      routeList,
      stopList,
      holidays: ["20260101"],
      serviceDayMap: {},
    },
    isTodayHoliday: false,
    autoRenew: false,
    AppTitle: "test",
    renewDb: vi.fn(),
    toggleAutoDbRenew: vi.fn(),
  }) as never;

const makeAppValue = (overrides: Record<string, unknown> = {}) =>
  ({
    isVisible: true,
    refreshInterval: 30000,
    ...overrides,
  }) as never;

/** Wraps the hook in the real (unmocked) context providers. */
const makeWrapper =
  (appOverrides: Record<string, unknown> = {}) =>
  ({ children }: { children: ReactNode }) => (
    <AppContext.Provider value={makeAppValue(appOverrides)}>
      <DbContext.Provider value={makeDbValue()}>{children}</DbContext.Provider>
    </AppContext.Provider>
  );

describe("useEtas", () => {
  beforeEach(() => {
    mockedFetchEtas.mockReset();
    mockedFetchEtas.mockResolvedValue([
      {
        eta: "2026-07-01T10:05:00.000+08:00",
        remark: { zh: "5分鐘", en: "5 min" },
        co: "kmb",
        dest: { zh: "終點站", en: "Terminus" },
      },
    ] as never);
  });

  afterEach(() => {
    cleanup();
  });

  it("starts with no ETAs and reports no error", async () => {
    const { result } = renderHook(() => useEtas("1A/1"), {
      wrapper: makeWrapper(),
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.error).toBeNull();
  });

  it("populates etas after a successful fetch", async () => {
    const { result } = renderHook(() => useEtas("1A/1"), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchEtas).toHaveBeenCalledTimes(1);
    expect(result.current.etas).toHaveLength(1);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("does not fetch while disabled", async () => {
    const { result } = renderHook(() => useEtas("1A/1", true), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchEtas).not.toHaveBeenCalled();
    expect(result.current.etas).toBeNull();
  });

  it("does not fetch when the app is not visible", async () => {
    const { result } = renderHook(() => useEtas("1A/1"), {
      wrapper: makeWrapper({ isVisible: false }),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedFetchEtas).not.toHaveBeenCalled();
    expect(result.current.etas).toBeNull();
  });

  it("exposes the error when the network call rejects", async () => {
    mockedFetchEtas.mockRejectedValueOnce(new Error("offline") as never);

    const { result } = renderHook(() => useEtas("1A/1"), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("offline");
    expect(result.current.etas).toBeNull();
  });

  it("refetch() triggers an extra request", async () => {
    const { result } = renderHook(() => useEtas("1A/1"), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(mockedFetchEtas).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockedFetchEtas).toHaveBeenCalledTimes(2);
  });
});
