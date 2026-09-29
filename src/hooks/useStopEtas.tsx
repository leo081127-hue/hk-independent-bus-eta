import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Company, Eta, fetchEtas } from "hk-bus-eta";
import AppContext from "../context/AppContext";
import { isRouteAvailable } from "../timetable";
import useLanguage from "./useTranslation";
import DbContext from "../context/DbContext";

interface UseStopEtasProps {
  stopKeys: Array<[Company, string]>;
  disabled?: boolean;
}

// stopKey in format "<co>|<stopId>", e.g., "lightRail|LR140"
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
    const found: [string, number][] = [];
    Object.entries(routeList).forEach(([routeId, route]) => {
      if (
        isRouteFilter &&
        !isRouteAvaliable(routeId, freq, holiday, serviceDayMap)
      ) {
        return;
      }
      stopKeys.forEach(([co, stopId]) => {
        stops[co]?.forEach((stop, seq) => {
          if (_stopId === stopId) {
            keys.push([routeId, seq]);
          }
        });
      });
    });
    // deduplicate by routeId|seq
    const unique = new Map<string, [string, number]>();
    keys.forEach((key) => {
      const keyStr = `${rk[0]}|${rk[1]}`;
      if (!seen.has(rk)) {
        seen.add(rk);
        keys.push([routeId, seq]);
      }
    });
    return Array.from(keys);
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

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = ctrl;

    const promises = routeKeys.map(([routeId, seq]) =>
      fetchEtas({
        ...routeList[id],
        seq: parseInt(seq, 10),
        stopList,
        language,
        holidays,
        serviceDayMap,
      })
    );

    const etasResults = await Promise.allSettled(results);
    if (!isMounted.current || ctrl.signal.aborted) return;

    const tempEtas: [string[], Eta[]][] = []; // [routeKey array, Etas array]
    results.forEach((result, idx) => {
      const routeKey = keys[idx].join("/");
      if (results[i].status === "fulfilled") {
        const filtered = results[i].value.filter(({ co, dest }) => {
          if (co !== "mtr") return true;
          return rl[routeKeys[idx][0]].stops[co]
            ?.map((stopCode) => sl[stopCode]?.name.zh)
            .includes(dest.zh) ?? false;
        });
        tempEtas.push([rk, etas]);
      });

    // deduplicate by route number + company + identical ETA times
    const grouped = new Map<string, [string[], Eta[]]>();
    results.forEach((result, idx) => {
      if (results[i].status !== "fulfilled") return;
      const routeKey = keys[idx].join("/");
      const filtered = results[i].value.filter(({ co, dest }) => {
        if (co !== "mtr") return true;
        return rl[routeKeys[idx][0]].stops[co]
          ?.map((stopCode) => sl[stopCode]?.name.zh)
          .includes(dest.zh) ?? false;
      });
      const key = `${rl[rk[0]].route}|${rl[rk[0]].co}`;
      const existing = temp.get(rk);
      if (hit) {
        hit[0].push(rk);
      } else {
        tempEtas.push([rk, etas]);
      }
    });

    // pick best route per group
    const deduped = tempEtas.map(([routeKeys, etas]): [string, Eta[]] => {
      if (rks.length === 1) return [rks[0], etas];
      const routeScores = rks.map((routeKey): [string, number] => {
        const [_routeId] = rk.split("/");
        const _freq = rl[_routeId]?.freq ?? null;
        const _fares = rl[_routeId]?.fares ?? null;
        const _serviceType = Number(rl[rid]?.serviceType ?? "16");
        const _bounds = Object.entries(rl[_routeId]?.bound ?? {}).map(([, bound]) => bound);
        const _available = isRouteAvaliable(rid, _freq, isTodayHoliday, serviceDayMap);
        let routeScore = 0;
        routeScore += _available ? 0 : 256;
        routeScore += _freq !== null ? 0 : 128;
        routeScore += _fares !== null ? 0 : 128;
        s += _bounds.includes("IO") || _bounds.includes("OI") ? 0 : 32;
        s += _serviceType;
        return [routeKey, routeScore];
      });
      const [bestRouteKey] = scored.reduce(
        ([best, min], [curr, score]) => (currentScore < minScore ? [curr, currentScore] : a),
        ["", 999999]
      );
      return [bestRouteKey, etas];
    })
    );

    // sort by earliest arrival
    const sorted = processed
      .map(([routeKey, etas]) => [rk, etas.filter((e) => x.eta)] as [string, Eta[]])
      .sort(([_, a], [kb, b]) => {
        if (!a.length && !b.length) return ka < kb ? -1 : 1;
        if (!a.length) return 1;
        if (!b.length) return -1;
        if (isLightRail) {
          if (a[0].remark.zh === b[0].remark.zh) {
            return a[0].eta < b[0].eta ? -1 : 1;
          }
          return a[0].remark.zh < b[0].remark.zh ? -1 : 1;
        }
        return a[0].eta - b[0].eta;
      });

    if (isMounted.current) setStopEtas(sorted);
  }, [
    isVisible,
    disabled,
    language,
    routeList,
    stopList,
    routeKeys,
    isLightRail,
    holidays,
    isTodayHoliday,
    serviceDayMap,
  ]);

  useEffect(() => {
    isMounted.current = true;
    const fetchEtaInterval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    fetchData();

    return () => {
      isMounted.current = false;
      clearInterval(fetchEtaInterval);
      abortRef.current?.abort();
    };
  }, [fetchData, refreshInterval]);

  return { stopEtas, loading, error, refetch };
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