import type { WeatherCurrent } from "../../shared-domain/src";

import type { WardrowbeApi } from "./types";

export interface ForecastDay {
  date: string;
  temp_min: number;
  temp_max: number;
  precipitation_chance: number;
  condition: string;
  condition_code: number;
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  forecast: ForecastDay[];
}

export function getCurrentWeather(api: WardrowbeApi): Promise<WeatherCurrent> {
  return api.get<WeatherCurrent>("/weather/current");
}

export function getWeatherForecast(api: WardrowbeApi, days: number): Promise<ForecastResponse> {
  return api.get<ForecastResponse>("/weather/forecast", { params: { days: String(days) } });
}
