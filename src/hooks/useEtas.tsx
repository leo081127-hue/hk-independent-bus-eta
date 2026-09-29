import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Eta, fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

export interface UseEtasReturn {
  etas: Eta[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useEtas = (routeId: string, disable: boolean = false) => {
  const { isVisible, refreshInterval } = useContext(AppContext);
  const {
    db: { routeList, stopList, holidays, serviceDayMap },
  } = useContext(DbContext);
  const [routeKey, seq] = routeId.split("/");
  const routeObj = routeList[routeKey] || DefaultRoute;
  const [etas, setEtas] = useState<Eta[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const language = useLanguage();

  const fetchData = useCallback(async () => {
    if (!isVisible || navigator.userAgent === "prerendering") {
      setEtas(null);
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const etas = await fetchEtas({
        ...routeObj,
        seq: parseInt(seq, 10),
        stopList,
        language,
        holidays,
        serviceDayMap,
      });
      if (isMounted.current) {
        setEtas(etas);
        setError(null);
      }
    } catch (error) {
      if (isMounted.current) {
        setError(error as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [isVisible, language, routeObj, seq, stopList, holidays, serviceDayMap]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (disabled) return;
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
  }, [fetchData, refreshInterval, disabled]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { etas, loading, error, refetch };
};

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

export interface UseEtasReturn {
  etas: Eta[] | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}