import "./style.css";
import { createApp } from "./app";

function ensureBaseMarkup(): void {
  if (!document.getElementById("scanline")) {
    const scanline = document.createElement("div");
    scanline.id = "scanline";
    document.body.prepend(scanline);
  }

  if (!document.getElementById("vignette-curse")) {
    const vignette = document.createElement("div");
    vignette.id = "vignette-curse";
    document.body.prepend(vignette);
  }

  let appRoot = document.getElementById("app");
  if (!appRoot) {
    appRoot = document.createElement("div");
    appRoot.id = "app";
    document.body.appendChild(appRoot);
  }

  if (!document.getElementById("game-canvas")) {
    const canvasHost = document.createElement("div");
    canvasHost.id = "game-canvas";
    appRoot.appendChild(canvasHost);
  }

  if (!document.getElementById("ui-layer")) {
    const uiLayer = document.createElement("div");
    uiLayer.id = "ui-layer";
    appRoot.appendChild(uiLayer);
  }
}

const bootstrap = () => {
  ensureBaseMarkup();
  createApp();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
