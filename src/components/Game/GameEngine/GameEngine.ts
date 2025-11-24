import { GameState } from "../GameState";
import { setupWorld } from "../World";
import { WorldLifecycle } from "./WorldLifecycle";
import { WorldFactory } from "./types";

export class GameEngine {
  private readonly lifecycle: WorldLifecycle;

  constructor(
    private readonly gameState: GameState,
    worldFactory: WorldFactory = setupWorld,
    lifecycle?: WorldLifecycle
  ) {
    this.lifecycle = lifecycle ?? new WorldLifecycle(worldFactory);
  }

  initialize(): void {
    this.lifecycle.boot(this.gameState);
    this.gameState.on("reset", this.handleReset);
  }

  teardown(): void {
    this.gameState.off("reset", this.handleReset);
    this.lifecycle.teardown();
  }

  private handleReset = (): void => {
    this.lifecycle.reset(this.gameState);
  };
}
