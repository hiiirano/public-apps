// 道さがしの計算（画面から切り離した純関数）。入力を書き換えず、同じ入力には同じ答えを返す。
import type {
  CityData,
  Comparison,
  Place,
  Point,
  RouteEdge,
  RouteMode,
  RouteResult,
  RouteStep,
} from "./types";

/** 歩く速さ（分速 60m）。地下の階段・人混み・信号待ちを見込んで、ゆっくりめにしている */
export const WALK_M_PER_MIN = 60;
/** 日陰の道さがしで、日なた 1m を何 m 分の遠回りと同じに見るか */
export const SUN_WEIGHT = 5;

export const isShaded = (edge: RouteEdge): boolean => edge.kind !== "outdoor";

export function edgeCost(edge: RouteEdge, mode: RouteMode): number {
  if (mode === "shortest" || isShaded(edge)) return edge.distanceM;
  return edge.distanceM * SUN_WEIGHT;
}

/** 距離 → 分（切り上げ。0m は 0 分、少しでも歩けば 1 分以上） */
export const minutesFor = (m: number): number => (m <= 0 ? 0 : Math.ceil(m / WALK_M_PER_MIN));

export class RouteError extends Error {
  constructor(public code: "unknown-place" | "no-route") {
    super(code === "unknown-place" ? "Unknown start or destination" : "No route found");
  }
}

function summarize(mode: RouteMode, from: string, to: string, steps: RouteStep[], nodeIds: string[]): RouteResult {
  let distanceM = 0;
  let shadeM = 0;
  for (const s of steps) {
    distanceM += s.edge.distanceM;
    if (isShaded(s.edge)) shadeM += s.edge.distanceM;
  }
  const sunM = distanceM - shadeM;
  return {
    mode,
    from,
    to,
    steps,
    nodeIds,
    distanceM,
    shadeM,
    sunM,
    // 切り捨て: 日なたが 1m でもあれば 100% と出さない。0m（同じ地点）は 100 とする
    shadeRatio: distanceM === 0 ? 100 : Math.floor((shadeM * 100) / distanceM),
    minutes: minutesFor(distanceM),
    sunMinutes: minutesFor(sunM),
  };
}

/** ダイクストラ法で、mode の重みがいちばん小さい道を返す。同じ重みなら道の数が少ない方、さらに同じならデータ順で早い方 */
export function route(city: CityData, from: string, to: string, mode: RouteMode): RouteResult {
  const ids = city.places.map((pl) => pl.id);
  if (!ids.includes(from) || !ids.includes(to)) throw new RouteError("unknown-place");
  if (from === to) return summarize(mode, from, to, [], [from]);

  const cost = new Map<string, number>(ids.map((id) => [id, Number.POSITIVE_INFINITY]));
  const hops = new Map<string, number>(ids.map((id) => [id, Number.POSITIVE_INFINITY]));
  const prev = new Map<string, { nodeId: string; edge: RouteEdge }>();
  const done = new Set<string>();
  cost.set(from, 0);
  hops.set(from, 0);

  for (;;) {
    let current: string | null = null;
    for (const id of ids) {
      if (done.has(id)) continue;
      const c = cost.get(id)!;
      if (!Number.isFinite(c)) continue;
      if (current === null || c < cost.get(current)!) current = id;
    }
    if (current === null || current === to) break;
    done.add(current);
    const base = cost.get(current)!;
    const baseHops = hops.get(current)!;
    for (const edge of city.edges) {
      const next = edge.from === current ? edge.to : edge.to === current ? edge.from : null;
      if (next === null || done.has(next)) continue;
      const c = base + edgeCost(edge, mode);
      const old = cost.get(next)!;
      if (c < old - 1e-9 || (Math.abs(c - old) <= 1e-9 && baseHops + 1 < hops.get(next)!)) {
        cost.set(next, c);
        hops.set(next, baseHops + 1);
        prev.set(next, { nodeId: current, edge });
      }
    }
  }

  if (!prev.has(to)) throw new RouteError("no-route");

  const steps: RouteStep[] = [];
  const nodeIds = [to];
  let cursor = to;
  while (cursor !== from) {
    const pr = prev.get(cursor)!;
    const forward = pr.edge.from === pr.nodeId;
    steps.unshift({
      edge: pr.edge,
      from: pr.nodeId,
      to: cursor,
      instruction: forward ? pr.edge.instruction.forward : pr.edge.instruction.reverse,
      points: forward ? pr.edge.points.slice() : pr.edge.points.slice().reverse(),
    });
    cursor = pr.nodeId;
    nodeIds.unshift(cursor);
  }
  return summarize(mode, from, to, steps, nodeIds);
}

/** 最短の道と日陰の道を並べてくらべる */
export function compareRoutes(city: CityData, from: string, to: string): Comparison {
  const shortest = route(city, from, to, "shortest");
  const shade = route(city, from, to, "shade");
  const same =
    shortest.steps.length === shade.steps.length &&
    shortest.steps.every((s, i) => s.edge.id === shade.steps[i].edge.id);
  return {
    shortest,
    shade,
    same,
    extraMinutes: Math.max(0, shade.minutes - shortest.minutes),
    sunSavedMinutes: Math.max(0, shortest.sunMinutes - shade.sunMinutes),
  };
}

export function selectablePlaces(city: CityData): Place[] {
  return city.places.filter((pl) => pl.selectable);
}

const near = (a: Point, b: Point) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

/** 都市データの形を検査し、問題の一覧を返す（空なら正常） */
export function validateCity(city: CityData): string[] {
  const problems: string[] = [];
  const byId = new Map<string, Place>();
  for (const pl of city.places) {
    if (byId.has(pl.id)) problems.push(`地点の id が重複: ${pl.id}`);
    byId.set(pl.id, pl);
  }
  const edgeIds = new Set<string>();
  const sourceIds = new Set(city.sources.map((s) => s.id));
  for (const e of city.edges) {
    if (edgeIds.has(e.id)) problems.push(`道の id が重複: ${e.id}`);
    edgeIds.add(e.id);
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) {
      problems.push(`道 ${e.id} の端の地点がない`);
      continue;
    }
    if (e.from === e.to) problems.push(`道 ${e.id} が同じ地点に戻っている`);
    if (!(Number.isFinite(e.distanceM) && e.distanceM > 0)) problems.push(`道 ${e.id} の距離が正でない`);
    if (!["underground", "covered", "outdoor"].includes(e.kind)) problems.push(`道 ${e.id} の種類が不明`);
    if (e.points.length < 2 || !near(e.points[0], a) || !near(e.points[e.points.length - 1], b))
      problems.push(`道 ${e.id} の線が地点とつながっていない`);
    if (!e.basis) problems.push(`道 ${e.id} に根拠がない`);
    if (e.sourceIds.length === 0 || e.sourceIds.some((s) => !sourceIds.has(s))) problems.push(`道 ${e.id} の出典が不明`);
  }
  // 選べる地点どうしは、すべてつながっていること
  const sel = selectablePlaces(city);
  for (const s of sel) {
    for (const t of sel) {
      if (s.id === t.id) continue;
      try {
        route(city, s.id, t.id, "shortest");
      } catch {
        problems.push(`${s.id} から ${t.id} へ行けない`);
      }
    }
  }
  return problems;
}
