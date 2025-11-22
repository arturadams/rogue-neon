import "./style.css";
import { ProgressBar } from "./components/UI/ProgressBar";
import { StatsPanel } from "./components/UI/StatsPanel";
import { SpellDock } from "./components/UI/SpellDock";
import { InventoryPanel } from "./components/UI/InventoryPanel";
import { ControlsPanel } from "./components/UI/ControlsPanel";
import { StarterModal } from "./components/UI/Modals/StarterModal";
import { StartScreenModal } from "./components/UI/Modals/StartScreenModal";
import { LevelUpModal } from "./components/UI/Modals/LevelUpModal";
import { ItemModal } from "./components/UI/Modals/ItemModal";
import { DatabaseModal } from "./components/UI/Modals/DatabaseModal";
import { GameOverModal } from "./components/UI/Modals/GameOverModal";
import { GameState } from "./components/Game/GameState";
import { UIController } from "./components/UI/UIController";

// Mount all UI components to #ui-layer
const uiLayer = document.getElementById("ui-layer");
if (uiLayer) {
  uiLayer.innerHTML =
    ProgressBar() +
    ControlsPanel() +
    StatsPanel() +
    SpellDock() +
    InventoryPanel() +
    StartScreenModal() +
    StarterModal() +
    LevelUpModal() +
    ItemModal() +
    DatabaseModal() +
    GameOverModal();
}

import { setupWorld } from "./components/Game/World";

const gameState = new GameState();
const uiController = new UIController(gameState);
uiController.initialize();

// Initialize the game world (THREE.js scene, camera, renderer, etc.)
setupWorld(gameState);
