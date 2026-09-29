import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Eta, fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

export interface UseEtasReturn {
  /** Latest ETA list, or null while the very first fetch is in flight. */
  etas: Eta[] | null;
  /** True while a fetch is in flight. */
  loading: boolean;
  /** Last fetch error, if any. */
  error: Error | null;
  /** Force an immediate refetch (ignores the refresh interval). */
  refetch: () => Promise<void>;
}

const DefaultRoute = {
  co: [""],
  stops: { "": [""] },
  dest: { zh: "", en: "" },
  bound: "",
  nlbId: 0,
  gtfsId: "",
  fares: [],
  faresHoliday: [],
};

export const useEtas = (routeId: string, disable = false): UseEtasReturn => {
  const { isVisible, refreshInterval } = useContext(AppContext);
  const {
    db: { routeList, stopList, holidays, serviceDayMap },
  } = useContext(DbContext);
  const [routeKey, seq] = routeId.split("/");
  const routeObj = routeList[routeKey] || DefaultRoute;
  const language = useLanguage();

  const [etas, setEtas] = useState<Eta[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (disable || !isVisible || navigator.userAgent === "prerendering") {
      setEtas(null);
      return;
    }

    // Cancel any request that is still in flight.
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const nextEtas = await fetchEtas({
        ...routeObj,
        seq: parseInt(seq, 10),
        stopList,
        language,
        holidays,
        serviceDayMap,
      });
      if (isMounted.current && !controller.signal.aborted) {
        setEtas(nextEtas);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current && !controller.signal.aborted) {
        setError(err as Error);
      }
    } finally {
      if (isMounted.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [
    disable,
    isVisible,
    language,
    routeObj,
    seq,
    stopList,
    holidays,
    serviceDayMap,
  ]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (disable) return;
    isMounted.current = true;
    const fetchEtaInterval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    fetchData();

    return () => {
      isMounted.current = false;
      clearInterval(fetchEtaInterval);
      abortControllerRef.current?.abort();
    };
  }, [fetchData, refreshInterval, disable]);

  return { etas, loading, error, refetch };
};
