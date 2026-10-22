import type { Person, Settings, State } from "./types";
import { FACE_COUNT, LEVELS, MAX_AMOUNT, MAX_PEOPLE, MIN_PEOPLE, UNITS } from "./types";
import { DEFAULT_SETTINGS, LESS_RANGE, MORE_RANGE } from "./warikan";

export const KEY = "warikan.on-the-spot.v3";
const NAME_MAX = 20;

let seq = 0;
export const newId = (): string =>
  `p${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 使われていない顔を若い番号から選ぶ。12人を超えたら少ない順に重ねる */
export function nextFace(people: Person[]): number {
  const used = new Array<number>(FACE_COUNT).fill(0);
  for (const p of people) used[p.face] += 1;
  const min = Math.min(...used);
  return used.indexOf(min);
}

export function newPerson(people: Person[]): Person {
  return { id: newId(), name: "", level: "normal", fixed: null, face: nextFace(people) };
}

export function freshState(): State {
  const people: Person[] = [];
  for (let i = 0; i < 4; i++) people.push(newPerson(people));
  return { amount: null, people, hostId: people[0].id, settings: { ...DEFAULT_SETTINGS } };
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

function validPerson(p: any): p is Person {
  return (
    p &&
    typeof p.id === "string" &&
    p.id.length > 0 &&
    p.id.length <= 40 &&
    typeof p.name === "string" &&
    p.name.length <= NAME_MAX &&
    LEVELS.includes(p.level) &&
    (p.fixed === null || isInt(p.fixed, 0, MAX_AMOUNT)) &&
    isInt(p.face, 0, FACE_COUNT - 1)
  );
}

function validSettings(s: any): s is Settings {
  return (
    s &&
    isInt(s.lessTenths, LESS_RANGE.min, LESS_RANGE.max) &&
    isInt(s.moreTenths, MORE_RANGE.min, MORE_RANGE.max) &&
    (UNITS as readonly number[]).includes(s.unit) &&
    (s.rounding === "up" || s.rounding === "down")
  );
}

/** 保存内容を検証して読む。壊れていたり古い形式なら初期状態 */
export function parseState(raw: string | null): State {
  try {
    const s = JSON.parse(raw ?? "null");
    if (
      !s ||
      !(s.amount === null || isInt(s.amount, 0, MAX_AMOUNT)) ||
      !Array.isArray(s.people) ||
      s.people.length < MIN_PEOPLE ||
      s.people.length > MAX_PEOPLE ||
      !s.people.every(validPerson) ||
      new Set(s.people.map((p: Person) => p.id)).size !== s.people.length ||
      !s.people.some((p: Person) => p.id === s.hostId) ||
      !validSettings(s.settings)
    )
      return freshState();
    return {
      amount: s.amount,
      people: s.people.map((p: Person) => ({ ...p })),
      hostId: s.hostId,
      settings: { ...s.settings },
    };
  } catch {
    return freshState();
  }
}

export function load(): State {
  try {
    return parseState(localStorage.getItem(KEY));
  } catch {
    return freshState();
  }
}

/** 保存できたら true。プライベートブラウズなどで保存できなくても計算は続けられる */
export function save(s: State): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export { NAME_MAX };
