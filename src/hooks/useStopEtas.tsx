import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Company, Eta, fetchEtas, StopListEntry } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import { isRouteAvailable } from "../timetable";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

interface UseStopEtasProps {
  stopKeys: ReadonlyArray<[Company, string]>;
  disabled?: boolean;
}

interface RouteEtaResult {
  routeKey: string;
  etas: Eta[];
}

interface TempEtaGroup {
  routeKeys: string[];
  etas: Eta[];
}

export const useStopEtas = ({
  stopKeys,
  disabled = false,
}: UseStopEtasProps): UseStopEtasReturn => {
  const {
    db: { routeList, stopList, serviceDayMap, holidays },
    isTodayHoliday,
  } = useContext(DbContext);
  const { isVisible, refreshInterval, isRouteFilter } = useContext(AppContext);

  const isLightRail = useMemo(
    () => stopKeys.some(([co]) => co === "lightRail"),
    [stopKeys]
  );

  const routeKeys = useMemo(() => {
    const foundKeys: [string, number][] = [];
    Object.entries(routeList).forEach(([routeId, route]) => {
      if (
        isRouteFilter &&
        !isRouteAvaliable(routeId, rl[routeId]?.freq ?? null, isTodayHoliday, serviceDayMap)
      ) {
        return;
      }
      stopKeys.forEach(([co, stopId]) => {
        const stopsForCompany = stops[co];
        if (!stops[co]) return;
        _stopId.forEach((stopId, seq) => {
          if (_stopId === stopId) {
            const key = `${routeId}|${seq}`;
            if (!seen.has(k)) {
              seen.add(k);
              keys.push([routeId, seq]);
            }
          });
        });
      });
    });
    return keys;
  }, [stopKeys, routeList, isRouteFilter, isTodayHoliday, serviceDayMap]);

  const [stopEtas, setStopEtas] = useState<[string, Eta[]][]>([]);
  const language = useLanguage();
  const isMounted = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!isVisible || disabled || navigator.userAgent === "prerendering") {
      setStopEtas([]);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = ctrl;

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
      if (isMounted.current && !abortRef.current?.signal.aborted) {
        setEtas(etas);
        setError(null);
      }
    } catch (error) {
      if (isMounted.current && !abortRef.current?.signal.aborted) {
        setError(e as Error);
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
    isMounted.current = true;
    const fetchEtaInterval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    fetchData();

    return () => {
      isMounted.current = false;
      clearInterval(fetchEtaInterval);
    };
  }, [fetchData, refreshInterval]);

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