import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 38,
        color: "#7aaa6a",
        background: "#121a10",
        fontSize: 116,
      }}
    >
      🐢
    </div>,
    size,
  );
}
