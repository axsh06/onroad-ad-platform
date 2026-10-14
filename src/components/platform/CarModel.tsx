"use client";
import { createElement, useEffect, useRef, useState } from "react";
import { useLocale } from "./Locale";
import { PLACEMENT_TYPES, SLOT_NAMES } from "@/lib/slots";
import {
  BMW_M5_MODEL,
  BMW_M5_HOTSPOTS,
  BMW_M5_VIEWS,
} from "@/lib/bmw-m5-model";
export type Hotspots = Record<string, { position: string; normal: string }>;
type ModelElement = HTMLElement & {
  loaded?: boolean;
  positionAndNormalFromPoint: (
    x: number,
    y: number,
  ) => {
    position: { x: number; y: number; z: number };
    normal: { x: number; y: number; z: number };
  } | null;
};
export function CarModel({
  src,
  hotspots,
  selected,
  onSelect,
  onAnnotate,
  photo,
  placements = PLACEMENT_TYPES,
}: {
  src?: string | null;
  hotspots?: Hotspots | null;
  selected?: string;
  onSelect?: (s: string) => void;
  onAnnotate?: (s: string, p: Hotspots[string]) => void;
  photo?: string;
  placements?: readonly string[];
}) {
  const { t } = useLocale();
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setMotion(!media.matches);
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const ref = useRef<ModelElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [active, setActive] = useState(Boolean(src));
  useEffect(() => {
    if (!active) return;
    let live = true;
    import("@google/model-viewer")
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, [active]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLoaded(false);
    const load = () => {
      setError(false);
      setLoaded(true);
    };
    const fail = () => setError(true);
    el.addEventListener("load", load);
    el.addEventListener("error", fail);
    if (el.loaded) load();
    return () => {
      el.removeEventListener("load", load);
      el.removeEventListener("error", fail);
    };
  }, [ready, src, active]);
  const points: Hotspots = src ? hotspots || {} : BMW_M5_HOTSPOTS;
  const choose = (key: string) => {
    setActive(true);
    onSelect?.(key);
  };
  const pick = (event: React.MouseEvent) => {
    if (!onAnnotate || !selected || !ref.current) return;
    const start = pointerStart.current;
    pointerStart.current = null;
    if (
      !start ||
      Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
    )
      return;
    const point = ref.current.positionAndNormalFromPoint(
      event.clientX,
      event.clientY,
    );
    if (!point) return;
    const position = [point.position.x, point.position.y, point.position.z];
    const normal = [point.normal.x, point.normal.y, point.normal.z];
    if (![...position, ...normal].every(Number.isFinite)) return;
    onAnnotate(selected, {
      position: position.map((v) => `${v.toFixed(6)}m`).join(" "),
      normal: normal.map((v) => v.toFixed(6)).join(" "),
    });
  };
  return (
    <div className="model-panel">
      <div className="model-stage">
        {!active ? (
          <button className="model-start" onClick={() => setActive(true)}>
            {photo && <img src={photo} alt="" />}
            <span>
              360°
              <small>
                {t("Открыть 3D-просмотр", "3D көрінісін ашу", "Open 3D viewer")}
              </small>
            </span>
          </button>
        ) : error ? (
          <div className="empty-state">
            {t(
              "3D недоступно на этом устройстве. Фотографии остаются доступными.",
              "Бұл құрылғыда 3D қолжетімсіз. Фотосуреттерді көре аласыз.",
              "3D is unavailable on this device. Photos are still available.",
            )}
          </div>
        ) : ready ? (
          createElement(
            "model-viewer",
            {
              ref,
              src: src || BMW_M5_MODEL,
              alt: src
                ? t(
                    "3D-модель автомобиля",
                    "Автомобильдің 3D моделі",
                    "3D car model",
                  )
                : "BMW M5 F90 · 2018 · 3D",
              "camera-controls": true,
              "interpolation-decay": motion ? 80 : 0,
              "interaction-prompt": "none",
              "shadow-intensity": "1",
              "environment-image": "neutral",
              "camera-orbit": !src
                ? BMW_M5_VIEWS[selected || "LEFT_DOOR"] || BMW_M5_VIEWS.LEFT_DOOR
                : (selected === "LEFT_DOOR"
                    ? "90deg"
                    : selected === "RIGHT_DOOR"
                      ? "-90deg"
                      : selected === "REAR_BODY"
                        ? "180deg"
                        : "25deg") + " 75deg 85%",
              "touch-action": "pan-y",
              onPointerDown: (event: React.PointerEvent) => {
                pointerStart.current = { x: event.clientX, y: event.clientY };
              },
              onClick: pick,
              style: { width: "100%", height: "100%" },
            },
            Object.entries(points)
              .filter(([key]) => placements.includes(key))
              .map(([key, p]) =>
                createElement(
                  "button",
                  {
                    key,
                    slot: `hotspot-${key}`,
                    "data-position": p.position,
                    "data-normal": p.normal,
                    "data-visibility-attribute": "visible",
                    className: `model-hotspot ${selected === key ? "selected" : ""}`,
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      choose(key);
                    },
                    "aria-label": SLOT_NAMES[key] ? t(...SLOT_NAMES[key]) : key,
                    "aria-pressed": selected === key,
                    title: SLOT_NAMES[key] ? t(...SLOT_NAMES[key]) : key,
                  },
                  String(placements.indexOf(key) + 1).padStart(2, "0"),
                ),
              ),
          )
        ) : (
          <p className="empty-state">
            {t("Загрузка 3D…", "3D жүктелуде…", "Loading 3D…")}
          </p>
        )}
        {active && ready && !loaded && !error && (
          <p className="model-loading" role="status">
            {t("Загрузка 3D…", "3D жүктелуде…", "Loading 3D…")}
          </p>
        )}
      </div>
      <div className="model-zone-list">
        {placements.map((key, i) => (
          <button
            key={key}
            aria-pressed={selected === key}
            onClick={() => choose(key)}
          >
            <span>0{i + 1}</span>
            {t(...SLOT_NAMES[key])}
          </button>
        ))}
      </div>
      <p className="model-note">
        {src
          ? t(
              "Модель автомобиля. Точные размеры наклейки согласуются до монтажа.",
              "Автомобиль моделі. Жапсырма өлшемдері орнатудан бұрын келісіледі.",
              "Vehicle model. Final decal dimensions are approved before installation.",
            )
          : t(
              "Демонстрационная BMW M5 F90, 2018. Вращайте модель мышью или пальцем. Выберите зону, чтобы изменить ракурс.",
              "Демонстрациялық BMW M5 F90, 2018. Модельді тінтуірмен немесе саусақпен айналдырыңыз. Көріністі өзгерту үшін аймақты таңдаңыз.",
              "Demo BMW M5 F90, 2018. Drag to rotate. Select a placement to change the view.",
            )}{" "}
        {!src && (
          <span className="model-attribution">
            <a
              href="https://sketchfab.com/3d-models/2018-bmw-m5-f90-7e76fd2d8b6d4d29b3da2b87936f826d"
              target="_blank"
              rel="noreferrer"
            >
              2018 BMW M5 (F90) · OUTPISTON
            </a>
            {" · "}
            <a
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY-NC-SA 4.0
            </a>
          </span>
        )}
      </p>
    </div>
  );
}
