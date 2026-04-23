import { useCallback, useMemo, useState } from "react";
import { Button, Image, Input, Picker, Slider, Switch, Text, Textarea, View } from "@tarojs/components";
import Taro, { useDidShow } from "@tarojs/taro";

import type { Outfit, SuggestRequest, SuggestTimeOfDay } from "@wardrowbe/shared-domain";
import { OCCASIONS } from "@wardrowbe/shared-domain";
import {
  acceptOutfit,
  getCurrentWeather,
  getPreferences,
  getWeatherForecast,
  rejectOutfit,
  suggestOutfit,
} from "@wardrowbe/shared-services";

import { api } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-storage";
import { addDays, getForecastDaysForTargetDate, isFutureISODate, toLocalISODate } from "@/lib/date-local";
import { resolveMediaUrl } from "@/lib/images";
import { clothingTypeZh, occasionLabelZh } from "@/lib/taxonomy-zh";
import { displayValue, tempSymbol, toCelsius, toF, type TempUnit } from "@/lib/temperature";

import "./index.scss";

type WeatherOverrideUi = { temperature: number; condition: "sunny" | "cloudy" | "rainy" };

const TIME_OF_DAY_OPTIONS: { label: string; value: SuggestTimeOfDay | "" }[] = [
  { label: "不指定时段", value: "" },
  { label: "上午", value: "morning" },
  { label: "下午", value: "afternoon" },
  { label: "晚上", value: "evening" },
  { label: "夜间", value: "night" },
  { label: "全天", value: "full day" },
];

const OCCASION_LABELS = OCCASIONS.map((o) => occasionLabelZh(o.value));

function parseUuidList(raw: string): string[] {
  return raw
    .split(/[\s,;]+/g)
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s));
}

function buildWeatherOverridePayload(w: WeatherOverrideUi): SuggestRequest["weather_override"] {
  const precip =
    w.condition === "rainy" ? 80 : w.condition === "cloudy" ? 30 : 10;
  return {
    temperature: w.temperature,
    feels_like: w.temperature,
    humidity: 50,
    precipitation_chance: precip,
    condition: w.condition,
  };
}

export default function SuggestPage() {
  const todayIso = useMemo(() => toLocalISODate(new Date()), []);
  const maxDateIso = useMemo(() => toLocalISODate(addDays(new Date(), 15)), []);

  const [occIndex, setOccIndex] = useState(0);
  const [todIndex, setTodIndex] = useState(0);
  const [targetDate, setTargetDate] = useState(todayIso);
  const [tempUnit, setTempUnit] = useState<TempUnit>("celsius");
  const [currentWeather, setCurrentWeather] = useState<Awaited<ReturnType<typeof getCurrentWeather>> | null>(null);
  const [forecastDay, setForecastDay] = useState<import("@wardrowbe/shared-services").ForecastDay | null>(null);
  const [weatherLoadErr, setWeatherLoadErr] = useState(false);

  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [weatherOverride, setWeatherOverride] = useState<WeatherOverrideUi | null>(null);

  const [excludeRaw, setExcludeRaw] = useState("");
  const [includeRaw, setIncludeRaw] = useState("");

  const [loading, setLoading] = useState(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const occasion = OCCASIONS[occIndex]?.value || "casual";
  const futureTarget = isFutureISODate(targetDate);

  const loadPreferencesAndWeather = useCallback(async () => {
    if (!getAccessToken()) return;
    try {
      const p = await getPreferences(api);
      setTempUnit(p.temperature_unit === "fahrenheit" ? "fahrenheit" : "celsius");
      const idx = OCCASIONS.findIndex((o) => o.value === p.default_occasion);
      if (idx >= 0) setOccIndex(idx);
    } catch {
      /* ignore */
    }

    try {
      const w = await getCurrentWeather(api);
      setCurrentWeather(w);
      setWeatherLoadErr(false);
    } catch {
      setCurrentWeather(null);
      setWeatherLoadErr(true);
    }
  }, []);

  const loadForecastForDate = useCallback(async (dateIso: string) => {
    if (!getAccessToken()) return;
    const days = Math.min(16, getForecastDaysForTargetDate(dateIso));
    if (days > 0) {
      try {
        const fc = await getWeatherForecast(api, days);
        const hit = fc.forecast.find((d) => d.date === dateIso) ?? fc.forecast[fc.forecast.length - 1] ?? null;
        setForecastDay(hit);
      } catch {
        setForecastDay(null);
      }
    } else {
      setForecastDay(null);
    }
  }, []);

  useDidShow(() => {
    void loadPreferencesAndWeather();
    void loadForecastForDate(targetDate);
  });

  const onTargetPreset = (iso: string) => {
    setTargetDate(iso);
    void loadForecastForDate(iso);
  };

  const ensureOverrideDefaults = () => {
    if (!weatherOverride && currentWeather) {
      setWeatherOverride({
        temperature: currentWeather.temperature,
        condition:
          currentWeather.condition.toLowerCase().includes("rain") || currentWeather.precipitation_chance > 50
            ? "rainy"
            : currentWeather.condition.toLowerCase().includes("cloud")
              ? "cloudy"
              : "sunny",
      });
    } else if (!weatherOverride) {
      setWeatherOverride({ temperature: 20, condition: "sunny" });
    }
  };

  const onToggleOverride = (on: boolean) => {
    setOverrideEnabled(on);
    if (on) ensureOverrideDefaults();
    else setWeatherOverride(null);
  };

  const setOverrideCondition = (c: WeatherOverrideUi["condition"]) => {
    setWeatherOverride((prev) => ({
      temperature: prev?.temperature ?? currentWeather?.temperature ?? 20,
      condition: c,
    }));
  };

  const sliderDisplayValue = weatherOverride
    ? tempUnit === "fahrenheit"
      ? Math.round(toF(weatherOverride.temperature))
      : weatherOverride.temperature
    : 0;

  const onSliderChange = (e: { detail: { value: number } }) => {
    const raw = e.detail.value;
    const celsius = tempUnit === "fahrenheit" ? Math.round(toCelsius(raw)) : raw;
    setWeatherOverride((prev) => ({
      condition: prev?.condition ?? "sunny",
      temperature: celsius,
    }));
  };

  const runSuggest = async () => {
    if (!getAccessToken()) {
      void Taro.redirectTo({ url: "/pages/login/index" });
      return;
    }
    if (targetDate < todayIso || targetDate > maxDateIso) {
      Taro.showToast({ title: `日期须在 ${todayIso}～${maxDateIso}`, icon: "none" });
      return;
    }

    setLoading(true);
    setOutfit(null);
    setErr(null);
    try {
      const tod = TIME_OF_DAY_OPTIONS[todIndex]?.value;
      const request: SuggestRequest = {
        occasion,
        target_date: targetDate.trim() || undefined,
      };
      if (tod) {
        request.time_of_day = tod;
      }
      if (overrideEnabled && weatherOverride) {
        request.weather_override = buildWeatherOverridePayload(weatherOverride);
      }
      const exclude = parseUuidList(excludeRaw);
      const include = parseUuidList(includeRaw);
      if (exclude.length) request.exclude_items = exclude;
      if (include.length) request.include_items = include;

      const o = await suggestOutfit(api, request);
      setOutfit(o);
      Taro.showToast({ title: "已生成", icon: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "生成失败";
      setErr(msg);
      Taro.showToast({ title: "生成失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  };

  const onAccept = async () => {
    if (!outfit) return;
    try {
      await acceptOutfit(api, outfit.id);
      setOutfit(null);
      Taro.showToast({ title: "已接受", icon: "success" });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const onReject = async () => {
    if (!outfit) return;
    try {
      await rejectOutfit(api, outfit.id);
      setOutfit(null);
      Taro.showToast({ title: "已拒绝", icon: "success" });
    } catch {
      Taro.showToast({ title: "操作失败", icon: "none" });
    }
  };

  const tryAnother = () => {
    setOutfit(null);
    void runSuggest();
  };

  const startOver = () => {
    setOutfit(null);
    setErr(null);
    setTargetDate(todayIso);
    setOverrideEnabled(false);
    setWeatherOverride(null);
    setExcludeRaw("");
    setIncludeRaw("");
    setTodIndex(0);
    void loadForecastForDate(todayIso);
  };

  const weekendIso = useMemo(() => {
    const t = new Date();
    const dow = t.getDay();
    const daysUntilSat = (6 - dow + 7) % 7 || 7;
    return toLocalISODate(addDays(t, daysUntilSat));
  }, []);

  if (outfit) {
    return (
      <View className="page">
        <View className="result-header">
          <Text className="badge">{occasionLabelZh(occasion)}</Text>
          {outfit.scheduled_for ? <Text className="date-badge">{outfit.scheduled_for}</Text> : null}
          <Button className="link-btn" size="mini" onClick={startOver}>
            重新选择
          </Button>
        </View>

        {outfit.weather ? (
          <View className="weather-bar">
            <Text className="weather-line">
              {displayValue(outfit.weather.temperature, tempUnit)}
              {tempSymbol(tempUnit)} · 体感 {displayValue(outfit.weather.feels_like, tempUnit)}
              {tempSymbol(tempUnit)} · 降雨 {outfit.weather.precipitation_chance}%
            </Text>
            <Text className="weather-line">{outfit.weather.condition}</Text>
          </View>
        ) : null}

        <View className="result">
          <Text className="result-title">{outfit.reasoning || "推荐搭配"}</Text>
          {outfit.highlights && outfit.highlights.length > 0 ? (
            <View className="highlights">
              {outfit.highlights.map((h, i) => (
                <Text className="hi-line" key={i}>
                  · {h}
                </Text>
              ))}
            </View>
          ) : null}
          <View className="row-imgs">
            {outfit.items.map((it) => (
              <View
                className="item-cell"
                key={it.id}
                onClick={() => void Taro.navigateTo({ url: `/pages/wardrobe/index?item=${it.id}` })}
              >
                <Image
                  className="mini"
                  mode="aspectFill"
                  src={resolveMediaUrl(it.thumbnail_url || it.image_url)}
                />
                <Text className="item-cap">{it.name || clothingTypeZh(it.type)}</Text>
              </View>
            ))}
          </View>
          {outfit.style_notes ? (
            <View className="style-tip">
              <Text className="style-tip-label">小贴士</Text>
              <Text className="style-tip-text">{outfit.style_notes}</Text>
            </View>
          ) : null}
        </View>

        <View className="result-actions">
          <Button className="btn-outline-wide" onClick={tryAnother}>
            换一套
          </Button>
          <Button className="btn-accept-wide" onClick={() => void onAccept()}>
            喜欢
          </Button>
        </View>
        <Button className="btn-reject-wide" onClick={() => void onReject()}>
          不喜欢并重新生成
        </Button>
      </View>
    );
  }

  return (
    <View className="page">
      <Text className="title">穿搭推荐</Text>
      <Text className="hint">与 Web 相同 POST /outfits/suggest（含时段、天气覆盖、排除/指定单品、target_date）。</Text>

      <Button className="btn-manual" size="mini" onClick={() => void Taro.navigateTo({ url: "/pages/outfit-new/index" })}>
        手动搭配（与 Web「手动搭配」一致）
      </Button>

      {futureTarget ? (
        <View className="card">
          <Text className="card-title">目标日预报</Text>
          {forecastDay ? (
            <Text className="forecast-text">
              {forecastDay.date} · 高 {displayValue(forecastDay.temp_max, tempUnit)}
              {tempSymbol(tempUnit)} / 低 {displayValue(forecastDay.temp_min, tempUnit)}
              {tempSymbol(tempUnit)} · {forecastDay.condition} · 雨 {forecastDay.precipitation_chance}%
            </Text>
          ) : (
            <Text className="muted">预报暂不可用</Text>
          )}
        </View>
      ) : (
        <View className="card">
          <Text className="card-title">当前天气</Text>
          {currentWeather && !weatherLoadErr ? (
            <Text className="forecast-text">
              {displayValue(currentWeather.temperature, tempUnit)}
              {tempSymbol(tempUnit)} · 体感 {displayValue(currentWeather.feels_like, tempUnit)}
              {tempSymbol(tempUnit)} · {currentWeather.condition} · 雨 {currentWeather.precipitation_chance}%
            </Text>
          ) : (
            <Text className="muted">未设置位置或无法加载（可到设置页配置）</Text>
          )}
        </View>
      )}

      <Text className="label">场合</Text>
      <Picker mode="selector" range={OCCASION_LABELS} value={occIndex} onChange={(e) => setOccIndex(Number(e.detail.value))}>
        <View className="picker-box">{OCCASION_LABELS[occIndex]}</View>
      </Picker>

      <Text className="label">时段（可选）</Text>
      <Picker mode="selector" range={TIME_OF_DAY_OPTIONS.map((x) => x.label)} value={todIndex} onChange={(e) => setTodIndex(Number(e.detail.value))}>
        <View className="picker-box">{TIME_OF_DAY_OPTIONS[todIndex]?.label}</View>
      </Picker>

      <Text className="label">穿着日期（今天～+15 天）</Text>
      <View className="presets">
        <Button className="preset" size="mini" onClick={() => onTargetPreset(todayIso)}>
          今天
        </Button>
        <Button className="preset" size="mini" onClick={() => onTargetPreset(toLocalISODate(addDays(new Date(), 1)))}>
          明天
        </Button>
        <Button className="preset" size="mini" onClick={() => onTargetPreset(toLocalISODate(addDays(new Date(), 3)))}>
          三天后
        </Button>
        <Button className="preset" size="mini" onClick={() => onTargetPreset(weekendIso)}>
          本周末
        </Button>
      </View>
      <Input
        className="input"
        placeholder="YYYY-MM-DD"
        value={targetDate}
        onInput={(e) => setTargetDate(e.detail.value)}
        onConfirm={() => void loadForecastForDate(targetDate)}
      />

      <View className="override-head">
        <Text className="label inline">手动覆盖天气</Text>
        <Switch checked={overrideEnabled} onChange={(e) => onToggleOverride(e.detail.value)} color="#c9a082" />
      </View>
      {overrideEnabled && weatherOverride ? (
        <View className="override-box">
          <View className="cond-row">
            {(["sunny", "cloudy", "rainy"] as const).map((c) => (
              <Button
                key={c}
                className={`cond-btn ${weatherOverride.condition === c ? "cond-on" : ""}`}
                size="mini"
                onClick={() => setOverrideCondition(c)}
              >
                {c === "sunny" ? "晴" : c === "cloudy" ? "阴" : "雨"}
              </Button>
            ))}
          </View>
          <Text className="slider-label">
            气温（{tempUnit === "fahrenheit" ? "°F" : "°C"}）: {sliderDisplayValue}
            {tempSymbol(tempUnit)}
          </Text>
          <Slider
            min={tempUnit === "fahrenheit" ? 14 : -10}
            max={tempUnit === "fahrenheit" ? 104 : 40}
            value={sliderDisplayValue}
            activeColor="#c9a082"
            backgroundColor="#333"
            blockSize={16}
            onChange={onSliderChange}
          />
          <Button className="reset-override" size="mini" onClick={() => onToggleOverride(false)}>
            清除覆盖
          </Button>
        </View>
      ) : null}

      <Text className="label">排除单品 ID（空格/逗号分隔 UUID）</Text>
      <Textarea className="textarea" value={excludeRaw} onInput={(e) => setExcludeRaw(e.detail.value)} />

      <Text className="label">必须包含单品 ID（可选）</Text>
      <Textarea className="textarea" value={includeRaw} onInput={(e) => setIncludeRaw(e.detail.value)} />

      {err ? <Text className="error-text">{err}</Text> : null}

      <Button className="btn" loading={loading} onClick={() => void runSuggest()}>
        生成推荐
      </Button>
    </View>
  );
}
