import type { CommercialState } from "../types/commercial";
import { seed } from "./demoData";

const STORAGE = "ferro-demo-v1";

// Conservar la misma clave evita perder los datos locales durante esta reorganización.
export function loadCommercialState(): CommercialState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || "null") || seed();
  } catch {
    return seed();
  }
}

export function saveCommercialState(data: CommercialState): void {
  localStorage.setItem(STORAGE, JSON.stringify(data));
}
