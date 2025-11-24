import { GameEngine } from "../components/Game/GameEngine";
import { GameState } from "../components/Game/GameState";
import { UIController } from "../components/UI/UIController";
import { UiLayerBuilder } from "../components/UI/UiLayerBuilder";

export class AppBootstrap {
  private gameEngine: GameEngine | null = null;

  run(): void {
    this.mountUiLayer();
    this.startGame();
  }

  private mountUiLayer(): void {
    const uiLayer = document.getElementById("ui-layer");
    const builder = new UiLayerBuilder(uiLayer);
    builder.mount();
  }

  private startGame(): void {
    const gameState = new GameState();
    const uiController = new UIController(gameState);
    uiController.initialize();

    this.gameEngine = new GameEngine(gameState);
    this.gameEngine.initialize();

    window.addEventListener("beforeunload", this.handleTeardown);
  }

  private handleTeardown = (): void => {
    this.gameEngine?.teardown();
    window.removeEventListener("beforeunload", this.handleTeardown);
  };
}
