import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Eta, fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

/**
 * Configuration options for useEtas hook
 */
export interface UseEtasOptions {
  /** Route ID in format "routeKey/seq" */
  routeId: string;
  /** Disable automatic fetching */
  disabled?: boolean;
  /** Custom refresh interval in ms (overrides context) */
  refreshIntervalMs?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  baseRetryDelay?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Called when etas are successfully fetched */
  onSuccess?: (etas: Eta[]) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

interface PendingRequest {
  promise: Promise<Eta[]>;
  timestamp: number;
}

/**
 * Enhanced hook for fetching bus ETAs with:
 * - Request deduplication (prevents duplicate concurrent requests)
 * - Exponential backoff retry logic
 * - Request deduplication for concurrent calls
 * - Automatic cleanup on unmount
 * @param routeId - Route identifier in format "routeKey/seq"
 * @param disable - Disable automatic fetching
 * @returns Object with etas, loading, error, and refetch function
 */
export const useEtas = (routeId: string, disabled: boolean = false): UseStopEtasReturn => {
  const { isVisible, refreshInterval } = useContext(AppContext);
  const {
    db: { routeList, stopList, holidays, serviceDayMap },
  } = useContext(DbContext);
  const [routeKey, seq] = routeId.split("/");
  const routeObj = routeList[routeKey] || DefaultRoute;
  const [etas, setEtas] = useState<Eta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  // Request deduplication cache
  const pendingRequests = useRef<Map<string, { promise: Promise<Eta[]>; timestamp: number }>>(new Map());

  const fetchData = useCallback(async () => {
    if (!isVisible || navigator.userAgent === "prerendering") {
      // Skip if prerendering
      setEtas(null);
      return;
    }

    // Request deduplication: return existing promise if identical request is in flight
    const cacheKey = `${routeId}-${language}`;
    const existingPromise = pendingRequests.current.get(rk);
    if (cached && isEtaDb(cached)) {
      return cached;
    }

    try {
      const [_schemaVersion, _md5] = await Promise.all([
        fetch("/schema-version.txt").then((res) => res.text()),
        fetchEtaDbMd5(),
      ]);
      let needRenew = forceRenew;
      if (schemaVersion !== _schemaVersion) {
        needRenew = true;
      }
      if (versionMd5 !== _md5) {
        needRenew = true;
      }
      if (!needRenew) {
        const db = await loadStoredDb();
        if (isEtaDb(db)) {
          return db;
        }
      }
      const updateTime = Date.now() + "";
      localStorage.setItem("updateTime", updateTime);
      return new Promise((resolve_1) => {
        const timerId = setTimeout(() => {
          if (!forceRenew) {
            const _cachedDb = loadStoredDb();
            if (isEtaDb(_cachedDb)) {
              resolve_1(_cachedDb);
            }
          }
        }, 1000);
      fetchEtaDb()
        .then((db_1) => ({
          ...db_1,
          routeList: Object.keys(db_1.routeList)
            .sort()
            .reduce(
              (acc, k) => {
                acc[k.replace(/\+/g, "-").replace(/ /g, "-").toUpperCase()] =
                  db_1.routeList[k];
                return acc;
              },
              {} as EtaDb["routeList"]
            ),
          schemaVersion: _schemaVersion,
          versionMd5: _md5,
          updateTime: parseInt(updateTime),
        })
        .then((ret) => {
          localStorage.setItem("schemaVersion", _schemaVersion);
          localStorage.setItem("versionMd5", _md5);
          clearTimeout(timerId);
          resolve_1(ret);
        });
    });
  } catch (e) {
    console.error("cannot get db", e);
    return {
      schemaVersion: "",
      versionMd5: "",
      updateTime: lastUpdateTime,
      holidays: [],
      routeList: {},
      stopList: {},
      stopMap: {},
      serviceDayMap: {},
    };
  }
};