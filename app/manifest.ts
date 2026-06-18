import type { MetadataRoute } from "next";

// Манифест PWA — приложение устанавливается «на экран» из браузера, без сторов.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Дневник пациента — эндокринология",
    short_name: "Дневник",
    description: "Дневник пациента эндокринологического профиля: глюкоза, анализы, питание, врач",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F7F6F3",
    theme_color: "#F7F6F3",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
