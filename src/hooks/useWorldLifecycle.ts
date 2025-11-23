import { GameState } from "../components/Game/GameState";
import { setupWorld } from "../components/Game/World";
import { WorldLifecycle } from "../types/world";

export function useWorldLifecycle(gameState: GameState): WorldLifecycle {
  let world = setupWorld(gameState);

  const getWorld = () => world;

  const resetWorld = () => {
    world.teardown();
    world = setupWorld(gameState);
    return world;
  };

  return { getWorld, resetWorld };
}
