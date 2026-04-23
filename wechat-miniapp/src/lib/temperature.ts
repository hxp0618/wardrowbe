/** Match `frontend/lib/temperature.ts` for dashboard weather display. */

export type TempUnit = "celsius" | "fahrenheit";

export function toF(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function displayValue(celsius: number, unit: TempUnit): number {
  return unit === "fahrenheit" ? Math.round(toF(celsius)) : Math.round(celsius);
}

export function tempSymbol(unit: TempUnit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}
