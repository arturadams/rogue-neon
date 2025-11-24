import { GameState } from "../GameState";
import { setupWorld } from "../World";

export type WorldInstance = ReturnType<typeof setupWorld>;

export type WorldFactory = (gameState: GameState) => WorldInstance;
