import "./style.css";
import { ProgressBar } from "./components/UI/ProgressBar";
import { StatsPanel } from "./components/UI/StatsPanel";
import { SpellDock } from "./components/UI/SpellDock";
import { InventoryPanel } from "./components/UI/InventoryPanel";
import { StarterModal } from "./components/UI/Modals/StarterModal";
import { LevelUpModal } from "./components/UI/Modals/LevelUpModal";
import { ItemModal } from "./components/UI/Modals/ItemModal";
import { DatabaseModal } from "./components/UI/Modals/DatabaseModal";
import { GameOverModal } from "./components/UI/Modals/GameOverModal";

// Mount all UI components to #ui-layer
const uiLayer = document.getElementById("ui-layer");
if (uiLayer) {
  uiLayer.innerHTML =
    ProgressBar() +
    StatsPanel() +
    SpellDock() +
    InventoryPanel() +
    StarterModal() +
    LevelUpModal() +
    ItemModal() +
    DatabaseModal() +
    GameOverModal();
}

import { setupWorld } from "./components/Game/World";

// Initialize the game world (THREE.js scene, camera, renderer, etc.)
setupWorld();
