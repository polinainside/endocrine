"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { X, Camera, ImageUp, Loader2 } from "lucide-react";

type Props = {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

type Mode = "loading" | "live" | "fallback";

// Сжимаем кадр до максимальной стороны 1024px и JPEG q0.7 — чтобы запрос был лёгким.
function toCompressedDataUrl(source: CanvasImageSource, w: number, h: number): string | null {
  if (!w || !h) return null;
  const maxSide = 1024;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    const stopStream = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMode("fallback");
        setNote("Камера недоступна в этом браузере — выберите фото.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setMode("live");
      } catch {
        setMode("fallback");
        setNote("Не удалось открыть камеру — можно выбрать фото из галереи.");
      }
    }

    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const shoot = () => {
    const v = videoRef.current;
    if (!v) return;
    const url = toCompressedDataUrl(v, v.videoWidth, v.videoHeight);
    if (url) {
      stopStream();
      onCapture(url);
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      const url = toCompressedDataUrl(img, img.naturalWidth, img.naturalHeight);
      URL.revokeObjectURL(objUrl);
      if (url) {
        stopStream();
        onCapture(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objUrl);
      setNote("Не удалось прочитать файл. Попробуйте другое фото.");
    };
    img.src = objUrl;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black animate-fade-in">
      {/* Верхняя панель */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-[15px] font-medium text-white/90">Сфотографируйте еду</span>
        <button
          onClick={() => {
            stopStream();
            onClose();
          }}
          aria-label="Закрыть"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Видоискатель / состояние */}
      <div className="relative flex-1 overflow-hidden">
        {mode === "loading" && (
          <div className="flex h-full items-center justify-center gap-2 text-white/80">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-[14px]">Открываем камеру…</span>
          </div>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${mode === "live" ? "" : "hidden"}`}
        />

        {mode === "fallback" && (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <Camera className="h-12 w-12 text-white/40" strokeWidth={1.5} />
            <p className="text-[14px] leading-relaxed text-white/70">{note}</p>
          </div>
        )}

        {/* рамка-подсказка поверх живого видео */}
        {mode === "live" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-60 w-60 rounded-3xl border-2 border-white/50" />
          </div>
        )}
      </div>

      {/* Нижняя панель управления */}
      <div className="flex items-center justify-center gap-8 px-4 py-6">
        {/* Выбор из галереи (всегда доступен) */}
        <label className="flex cursor-pointer flex-col items-center gap-1 text-white/80">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <ImageUp className="h-5 w-5" />
          </span>
          <span className="text-[11px]">галерея</span>
          <input type="file" accept="image/*" capture="environment" onChange={onFile} className="hidden" />
        </label>

        {/* Затвор */}
        {mode === "live" ? (
          <button
            onClick={shoot}
            aria-label="Снять"
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white/80 bg-white transition-transform active:scale-95"
          >
            <span className="h-14 w-14 rounded-full bg-white ring-2 ring-black/10" />
          </button>
        ) : (
          <span className="h-[72px] w-[72px]" />
        )}

        {/* распорка для симметрии */}
        <span className="h-11 w-11" />
      </div>
    </div>
  );
}
