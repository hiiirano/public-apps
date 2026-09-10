import type {
  CityData,
  RouteEdge,
  RouteMode,
  RouteResult,
  RouteStep,
} from "./types";

function edgeCost(edge: RouteEdge, mode: RouteMode): number {
  if (mode === "shortest") return edge.distanceM;
  const exposedPenalty = edge.covered ? 0 : edge.distanceM * 4;
  return edge.distanceM + exposedPenalty;
}

function instructionFor(edge: RouteEdge, from: string): string {
  return edge.from === from
    ? edge.instruction.forward
    : edge.instruction.reverse;
}

export function route(
  city: CityData,
  from: string,
  to: string,
  mode: RouteMode,
): RouteResult {
  const placeIds = new Set(city.places.map((place) => place.id));
  if (!placeIds.has(from) || !placeIds.has(to)) {
    throw new Error("Unknown start or destination");
  }
  if (from === to) {
    return {
      mode,
      from,
      to,
      steps: [],
      nodeIds: [from],
      distanceM: 0,
      coveredM: 0,
      exposedM: 0,
      coveredRatio: 100,
      minutes: 0,
    };
  }

  const distances = new Map<string, number>();
  const previous = new Map<string, { nodeId: string; edge: RouteEdge }>();
  const unvisited = new Set(placeIds);
  for (const id of placeIds) distances.set(id, Number.POSITIVE_INFINITY);
  distances.set(from, 0);

  while (unvisited.size > 0) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const id of unvisited) {
      const value = distances.get(id) ?? Number.POSITIVE_INFINITY;
      if (value < best) {
        current = id;
        best = value;
      }
    }
    if (current === null || !Number.isFinite(best)) break;
    if (current === to) break;
    unvisited.delete(current);

    for (const edge of city.edges) {
      let neighbor: string | null = null;
      if (edge.from === current) neighbor = edge.to;
      if (edge.to === current) neighbor = edge.from;
      if (neighbor === null || !unvisited.has(neighbor)) continue;

      const candidate = best + edgeCost(edge, mode);
      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate);
        previous.set(neighbor, { nodeId: current, edge });
      }
    }
  }

  if (!previous.has(to)) throw new Error("No route found");

  const reverseSteps: RouteStep[] = [];
  const reverseNodes = [to];
  let cursor = to;
  while (cursor !== from) {
    const prev = previous.get(cursor);
    if (!prev) throw new Error("Broken route chain");
    reverseSteps.push({
      edge: prev.edge,
      from: prev.nodeId,
      to: cursor,
      instruction: instructionFor(prev.edge, prev.nodeId),
    });
    cursor = prev.nodeId;
    reverseNodes.push(cursor);
  }

  const steps = reverseSteps.reverse();
  const nodeIds = reverseNodes.reverse();
  const distanceM = steps.reduce((sum, step) => sum + step.edge.distanceM, 0);
  const coveredM = steps.reduce(
    (sum, step) => sum + (step.edge.covered ? step.edge.distanceM : 0),
    0,
  );
  const exposedM = distanceM - coveredM;

  return {
    mode,
    from,
    to,
    steps,
    nodeIds,
    distanceM,
    coveredM,
    exposedM,
    coveredRatio: distanceM === 0 ? 100 : Math.round((coveredM / distanceM) * 100),
    minutes: distanceM === 0 ? 0 : Math.max(1, Math.ceil(distanceM / 60)),
  };
}

export function selectablePlaces(city: CityData) {
  return city.places.filter((place) => place.selectable);
}
