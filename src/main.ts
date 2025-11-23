import "./style.css";
import { createApp } from "./app";

const bootstrap = () => {
  createApp();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
} else {
  bootstrap();
}
