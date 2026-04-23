import { describe, expect, it, vi } from "vitest";

import { getCurrentWeather, getWeatherForecast } from "./weather";
import type { WardrowbeApi } from "./types";

describe("weather service", () => {
  it("getCurrentWeather hits /weather/current", async () => {
    const get = vi.fn().mockResolvedValue({});
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await getCurrentWeather(api);
    expect(get).toHaveBeenCalledWith("/weather/current");
  });

  it("getWeatherForecast passes days", async () => {
    const get = vi.fn().mockResolvedValue({});
    const api = { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() } as unknown as WardrowbeApi;
    await getWeatherForecast(api, 7);
    expect(get).toHaveBeenCalledWith("/weather/forecast", { params: { days: "7" } });
  });
});
