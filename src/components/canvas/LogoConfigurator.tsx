"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { useLocale } from "@/components/platform/Locale";
import { SLOT_NAMES } from "@/lib/slots";
export type SlotType =
  | "LEFT_DOOR"
  | "RIGHT_DOOR"
  | "REAR_BODY"
  | "HOOD"
  | "FRONT_DOORS"
  | "REAR_DOORS"
  | "FENDERS"
  | "REAR_WINDOW_BUMPER";
type Props = {
  carImageUrl: string;
  selectedSlot: SlotType;
  onChange?: (data: { fabricJson: object; previewUrl: string }) => void;
  className?: string;
};
export function LogoConfigurator({
  carImageUrl,
  selectedSlot,
  onChange,
  className = "",
}: Props) {
  const { t } = useLocale();
  const canvasNode = useRef<HTMLCanvasElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const logoRef = useRef<fabric.FabricImage | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasLogo, setHasLogo] = useState(false);
  const [error, setError] = useState("");
  const [exportUrl, setExportUrl] = useState("");
  const [opacity, setOpacity] = useState(90);
  const [angle, setAngle] = useState(0);
  const [size, setSize] = useState(140);
  useEffect(
    () => () => {
      if (exportUrl) URL.revokeObjectURL(exportUrl);
    },
    [exportUrl],
  );
  const emit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onChangeRef.current) return;
    try {
      onChangeRef.current({
        fabricJson: canvas.toJSON(),
        previewUrl: canvas.toDataURL({
          format: "jpeg",
          quality: 0.85,
          multiplier: 1,
        }),
      });
    } catch {
      /* A failed image load is reported by the load handler. */
    }
  }, []);
  useEffect(() => {
    if (!canvasNode.current || !holder.current) return;
    let alive = true;
    setReady(false);
    setHasLogo(false);
    setError("");
    setExportUrl("");
    logoRef.current = null;
    const canvas = new fabric.Canvas(canvasNode.current, {
      width: 800,
      height: 500,
      backgroundColor: "#e9ebe7",
      preserveObjectStacking: true,
    });
    canvasRef.current = canvas;
    const resize = () => {
      const width = Math.min(holder.current?.clientWidth || 800, 800);
      canvas.setDimensions(
        { width: `${width}px`, height: `${(width * 500) / 800}px` },
        { cssOnly: true },
      );
      canvas.calcOffset();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(holder.current);
    resize();
    fabric.FabricImage.fromURL(carImageUrl, { crossOrigin: "anonymous" })
      .then((img) => {
        if (!alive) return;
        const scale = Math.min(800 / img.width, 500 / img.height);
        img.set({
          originX: "left",
          originY: "top",
          left: (800 - img.width * scale) / 2,
          top: (500 - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = img;
        canvas.requestRenderAll();
        setReady(true);
      })
      .catch(() => {
        if (alive)
          setError(
            t(
              "Фотография не загрузилась. Выберите другую.",
              "Фото жүктелмеді. Басқасын таңдаңыз.",
              "Photo could not load. Choose another.",
            ),
          );
      });
    canvas.on("object:modified", () => {
      const logo = logoRef.current;
      if (logo) {
        setAngle(Math.round(logo.angle));
        setSize(Math.round(logo.getScaledWidth()));
      }
      emit();
    });
    return () => {
      alive = false;
      observer.disconnect();
      if (canvasRef.current === canvas) canvasRef.current = null;
      void canvas.dispose();
    };
    // Language changes should not erase a user's artwork.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carImageUrl, emit]);
  async function addLogo(source: string) {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    setBusy(true);
    setError("");
    try {
      const loaded = await fabric.FabricImage.fromURL(source, {
        crossOrigin: "anonymous",
      });
      const bitmap = document.createElement("canvas");
      const ratio = Math.min(1, 800 / loaded.width, 800 / loaded.height);
      bitmap.width = Math.max(1, Math.round(loaded.width * ratio));
      bitmap.height = Math.max(1, Math.round(loaded.height * ratio));
      const context = bitmap.getContext("2d");
      if (!context) throw Error("CANVAS_UNAVAILABLE");
      context.drawImage(loaded.getElement(), 0, 0, bitmap.width, bitmap.height);
      const img = await fabric.FabricImage.fromURL(
        bitmap.toDataURL("image/png"),
      );
      if (canvasRef.current !== canvas) return;
      if (logoRef.current) canvas.remove(logoRef.current);
      img.scaleToWidth(140);
      img.set({
        originX: "center",
        originY: "center",
        left: 470,
        top: 300,
        opacity: 0.9,
        cornerColor: "#202720",
        borderColor: "#202720",
        cornerSize: 13,
        transparentCorners: false,
      });
      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
      logoRef.current = img;
      setHasLogo(true);
      setSize(140);
      setAngle(0);
      setOpacity(90);
      emit();
    } catch {
      setError(
        t(
          "Не удалось открыть логотип.",
          "Логотип ашылмады.",
          "Could not open logo.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        file.type,
      ) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError(
        t(
          "Выберите PNG, JPG, WebP или SVG до 2 МБ.",
          "2 МБ-қа дейін PNG, JPG, WebP немесе SVG таңдаңыз.",
          "Choose PNG, JPG, WebP or SVG up to 2 MB.",
        ),
      );
      return;
    }
    if (file.type === "image/svg+xml") {
      const raw = await file.text();
      if (
        /<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|javascript:)/i.test(
          raw,
        )
      ) {
        setError(
          t(
            "SVG должен содержать только графику без внешних ссылок.",
            "SVG тек сыртқы сілтемесіз графикадан тұруы керек.",
            "SVG must contain graphics only, without external links.",
          ),
        );
        return;
      }
    }
    const url = URL.createObjectURL(file);
    try {
      await addLogo(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  function change(kind: "opacity" | "angle" | "size", value: number) {
    const logo = logoRef.current;
    if (!logo) return;
    if (kind === "opacity") {
      logo.set("opacity", value / 100);
      setOpacity(value);
    }
    if (kind === "angle") {
      logo.set("angle", value);
      setAngle(value);
    }
    if (kind === "size") {
      logo.scaleToWidth(value);
      setSize(value);
    }
    logo.setCoords();
    canvasRef.current?.requestRenderAll();
    emit();
  }
  function reset() {
    const canvas = canvasRef.current;
    if (canvas && logoRef.current) canvas.remove(logoRef.current);
    logoRef.current = null;
    setHasLogo(false);
    canvas?.requestRenderAll();
    emit();
  }
  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.discardActiveObject();
    canvas.renderAll();
    try {
      canvas.toCanvasElement(1.5).toBlob((blob) => {
        if (canvasRef.current !== canvas) return;
        if (!blob) {
          setError(
            t(
              "Не удалось создать PNG.",
              "PNG жасау мүмкін болмады.",
              "Could not create the PNG.",
            ),
          );
          return;
        }
        const url = URL.createObjectURL(blob);
        setExportUrl(url);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ONROAD-${selectedSlot}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, "image/png");
    } catch {
      setError(
        t(
          "Не удалось сохранить макет. Загрузите фото заново.",
          "Макетті сақтау мүмкін болмады. Фотоны қайта жүктеңіз.",
          "Could not export the mockup. Reload the photo.",
        ),
      );
    }
  }
  return (
    <div className={`logo-studio ${className}`}>
      <div className="studio-toolbar">
        <label className="outline-button">
          {t("Загрузить логотип", "Логотип жүктеу", "Upload logo")}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            disabled={!ready || busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="outline-button"
          disabled={!ready || busy}
          onClick={() => void addLogo("/onroad-logo-dark.svg")}
        >
          {t("Пример ONROAD", "ONROAD үлгісі", "Try ONROAD")}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={!hasLogo}
          onClick={reset}
        >
          {t("Удалить логотип", "Логотипті жою", "Remove logo")}
        </button>
        <button
          type="button"
          className="solid-button"
          disabled={!ready || busy}
          onClick={download}
        >
          {t("Скачать макет", "Макетті жүктеу", "Download mockup")}
        </button>
      </div>
      {exportUrl && (
        <p role="status" className="fine-print">
          {t(
            "PNG готов. Если скачивание не началось:",
            "PNG дайын. Жүктеу басталмаса:",
            "PNG is ready. If the download did not start:",
          )}{" "}
          <a href={exportUrl} target="_blank" rel="noreferrer">
            {t("Открыть макет", "Макетті ашу", "Open mockup")}
          </a>
        </p>
      )}
      <p className="fine-print">
        {t("Выбранная зона", "Таңдалған аймақ", "Selected placement")}:{" "}
        <strong>{t(...SLOT_NAMES[selectedSlot])}</strong>.{" "}
        {t(
          "Выберите подходящий ракурс и разместите логотип вручную на кузове.",
          "Тиісті ракурсты таңдап, логотипті кузовқа қолмен орналастырыңыз.",
          "Choose the matching view and position the logo manually on the body.",
        )}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div
        className="studio-canvas"
        ref={holder}
        aria-label={t("Редактор макета", "Макет редакторы", "Mockup editor")}
      >
        <canvas ref={canvasNode} />
      </div>
      {busy && <p role="status">{t("Загрузка…", "Жүктелуде…", "Loading…")}</p>}
      {hasLogo && (
        <div className="studio-sliders">
          <label>
            {t("Размер", "Өлшем", "Size")}: {size}px
            <input
              type="range"
              min={25}
              max={600}
              value={size}
              onChange={(e) => change("size", +e.target.value)}
            />
          </label>
          <label>
            {t("Поворот", "Бұрылу", "Rotation")}: {angle}°
            <input
              type="range"
              min={-180}
              max={180}
              value={angle}
              onChange={(e) => change("angle", +e.target.value)}
            />
          </label>
          <label>
            {t("Прозрачность", "Мөлдірлік", "Opacity")}: {opacity}%
            <input
              type="range"
              min={10}
              max={100}
              value={opacity}
              onChange={(e) => change("opacity", +e.target.value)}
            />
          </label>
        </div>
      )}
      <p className="fine-print">
        {t(
          "Перетащите логотип мышью или пальцем. Угловые маркеры меняют размер. Макет предварительный — размеры и монтаж согласуются отдельно.",
          "Логотипті тышқанмен немесе саусақпен жылжытыңыз. Бұрыштық белгілер өлшемді өзгертеді. Бұл алдын ала макет, өлшемдер мен орнату бөлек келісіледі.",
          "Drag with a mouse or finger. Corner handles resize the logo. This is a draft; final dimensions and installation are agreed separately.",
        )}
      </p>
    </div>
  );
}
