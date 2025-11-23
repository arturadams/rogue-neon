import { GameState } from "../components/Game/GameState";
import { UIController } from "../components/UI/UIController";
import { buildUiLayerMarkup } from "../components/UI/layout";

export function useUiLayer(gameState: GameState, targetId = "ui-layer") {
  const uiLayer = document.getElementById(targetId);
  if (uiLayer) {
    uiLayer.innerHTML = buildUiLayerMarkup();
  }

  const uiController = new UIController(gameState);
  uiController.initialize();

  return { uiController };
}
