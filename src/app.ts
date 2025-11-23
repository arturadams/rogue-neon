import { GameState } from "./components/Game/GameState";
import { useUiLayer } from "./hooks/useUiLayer";
import { useWorldLifecycle } from "./hooks/useWorldLifecycle";
import { AppContext } from "./types/app";

export function createApp(): AppContext {
  const gameState = new GameState();
  const { uiController } = useUiLayer(gameState);
  const { getWorld, resetWorld } = useWorldLifecycle(gameState);

  gameState.on("reset", resetWorld);

  return {
    gameState,
    uiController,
    get world() {
      return getWorld();
    },
    resetWorld,
  };
}
