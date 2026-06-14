import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Turtle Soup AI",
    short_name: "Turtle Soup",
    description: "AI와 함께 푸는 바다거북 스프 상황 추리 게임",
    start_url: "/",
    display: "standalone",
    background_color: "#0c0c11",
    theme_color: "#0c0c11",
    lang: "ko",
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
