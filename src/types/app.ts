import { GameState } from "../components/Game/GameState";
import { UIController } from "../components/UI/UIController";
import { GameWorld } from "./world";

export interface AppContext {
  gameState: GameState;
  uiController: UIController;
  world: GameWorld;
  resetWorld: () => GameWorld;
}
