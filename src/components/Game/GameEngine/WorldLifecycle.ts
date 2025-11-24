import { GameState } from "../GameState";
import { WorldFactory, WorldInstance } from "./types";

export class WorldLifecycle {
  private world: WorldInstance | null = null;

  constructor(private readonly createWorld: WorldFactory) {}

  boot(gameState: GameState): void {
    this.world = this.createWorld(gameState);
  }

  reset(gameState: GameState): void {
    this.teardown();
    this.boot(gameState);
  }

  teardown(): void {
    this.world?.teardown();
    this.world = null;
  }
}
