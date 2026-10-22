import type { State } from "./types";
import { defaultRatios } from "./warikan";
export const key = "warikan.on-the-spot.v2";
export const fresh = (): State => ({
  amount: "",
  people: Array.from({ length: 4 }, () => ({
    name: "",
    level: "normal",
    fixed: "",
  })),
  host: 0,
  method: "cash",
  unit: 100,
  ratios: { ...defaultRatios },
});
export function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    if (
      !s ||
      !Array.isArray(s.people) ||
      s.people.length < 1 ||
      s.people.length > 100 ||
      !s.people.every(
        (p: any) =>
          typeof p.name === "string" &&
          p.name.length <= 30 &&
          Object.prototype.hasOwnProperty.call(defaultRatios, p.level) &&
          typeof p.fixed === "string" &&
          /^(\d{1,9})?$/.test(p.fixed),
      ) ||
      !Number.isInteger(s.host) ||
      !s.people[s.host] ||
      ![1, 10, 100, 500].includes(s.unit) ||
      !["cash", "digital"].includes(s.method) ||
      typeof s.amount !== "string" ||
      !/^(\d{1,9})?$/.test(s.amount) ||
      !s.ratios ||
      !Object.keys(defaultRatios).every(
        (k) =>
          typeof s.ratios[k] === "number" &&
          s.ratios[k] >= 0 &&
          s.ratios[k] <= 100,
      )
    )
      return fresh();
    return s;
  } catch {
    return fresh();
  }
}
export function save(s: State) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
