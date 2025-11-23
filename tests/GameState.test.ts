import { describe, expect, test } from "vitest";
import { GameState } from "../src/components/Game/GameState";
import { ITEMS } from "../src/components/Game/Items";
import { WEAPONS } from "../src/components/Game/Weapons";

function createTestGame(initialRandom = 0.5) {
  let randomValue = initialRandom;
  const game = new GameState(() => randomValue);
  return { game, setRandom: (value: number) => (randomValue = value) };
}

describe("GameState", () => {
  test("initial HUD mirrors base player stats and wave info", () => {
    const { game } = createTestGame();
    const hud = game.getHudState();
    expect(hud.hp).toBe(100);
    expect(hud.maxHp).toBe(100);
    expect(hud.level).toBe(1);
    expect(hud.wave).toBe(1);
    expect(hud.maxWave).toBe(20);
    expect(hud.progress).toBe(0);
    expect(hud.isRunning).toBe(false);
    expect(hud.isPaused).toBe(false);
  });

  test("start and pause toggles emit correct state", () => {
    const { game } = createTestGame();
    const states: Array<{ isRunning: boolean; isPaused: boolean }> = [];
    game.on("state", (payload) => states.push(payload));

    game.togglePause();
    expect(states).toHaveLength(0);

    game.startGame();
    expect(states.at(-1)).toEqual({ isRunning: true, isPaused: false });

    game.togglePause();
    expect(states.at(-1)).toEqual({ isRunning: true, isPaused: true });

    game.togglePause();
    expect(states.at(-1)).toEqual({ isRunning: true, isPaused: false });
  });

  test("modal pause overrides gameplay pause state", () => {
    const { game } = createTestGame();
    game.startGame();
    game.setModalPause(true);
    expect(game.getHudState().isPaused).toBe(true);

    game.setModalPause(false);
    expect(game.getHudState().isPaused).toBe(false);
  });

  test("speed adjustments sanitize invalid values", () => {
    const { game } = createTestGame();
    game.setSpeed(-2);
    expect(game.getHudState().speed).toBeCloseTo(1);

    game.setSpeed(0);
    expect(game.getHudState().speed).toBeCloseTo(1);

    game.setSpeed(0.1);
    expect(game.getHudState().speed).toBeCloseTo(0.25);

    game.setSpeed(2);
    expect(game.getHudState().speed).toBe(2);
  });

  test("wave progression grants gold and caps at max wave", () => {
    const { game } = createTestGame();
    game.startGame();
    game.tick(20000);
    const afterFirstWave = game.getHudState();
    expect(afterFirstWave.wave).toBe(2);
    expect(afterFirstWave.progress).toBe(0);
    expect(afterFirstWave.gold).toBe(5);

    (game as any).wave = afterFirstWave.maxWave;
    game.tick(40000);
    const afterMaxWave = game.getHudState();
    expect(afterMaxWave.wave).toBe(afterFirstWave.maxWave);
    expect(afterMaxWave.progress).toBe(1);
  });

  test("damage, healing, and gold are clamped to sensible ranges", () => {
    const { game } = createTestGame();
    game.takeDamage(30);
    expect(game.getHudState().hp).toBe(70);

    game.heal(50);
    expect(game.getHudState().hp).toBe(100);

    game.takeDamage(150);
    expect(game.getHudState().hp).toBe(0);

    game.addGold(10);
    expect(game.getHudState().gold).toBe(10);
  });

  test("picking up specific items and weighted rolls adds to inventory", () => {
    const { game, setRandom } = createTestGame();
    const picked: string[] = [];
    game.on("item", (item) => picked.push(item.id));

    game.pickupItem("i_02");
    expect(game.getHudState().gold).toBe(0);
    expect(picked).toContain("i_02");

    setRandom(0);
    game.pickupItem(undefined, { rare: 1 });
    const rareItem = ITEMS.find((item) => item.rarity === "rare")!;
    expect(picked).toContain(rareItem.id);
  });

  test("starter selection prevents duplicates and tracks weapons", () => {
    const { game } = createTestGame();
    const starterId = WEAPONS[0].id;
    game.selectStarterWeapon(starterId);
    game.selectStarterWeapon(starterId);
    expect(game.getActiveWeapons()).toEqual([starterId]);
  });

  test("level up choices generate deterministic pools and upgrade levels", () => {
    const { game, setRandom } = createTestGame();
    let latestChoices: any[] = [];
    game.on("levelUp", (choices) => (latestChoices = choices));

    setRandom(0);
    game.collectXp(100);
    expect(latestChoices).toHaveLength(3);
    const firstWeapon = WEAPONS[0];
    expect(latestChoices[0].id).toBe(firstWeapon.id);
    expect(latestChoices[0].isUpgrade).toBe(false);

    game.chooseLevelUp(firstWeapon.id, "weapon");
    expect(game.getActiveWeapons()).toContain(firstWeapon.id);

    setRandom(0);
    game.collectXp(game.getHudState().maxXp);
    expect(latestChoices[0].level).toBeGreaterThan(1);
  });

  test("passive choices respect slot limits and rerolls consume charges", () => {
    const { game, setRandom } = createTestGame();
    let choices: any[] = [];
    game.on("levelUp", (payload) => (choices = payload));

    setRandom(0.99);
    game.collectXp(game.getHudState().maxXp);
    const passiveChoice = choices.find((choice) => choice.kind === "passive");
    expect(passiveChoice).toBeDefined();

    if (passiveChoice) {
      game.chooseLevelUp(passiveChoice.id, "passive");
      expect((game as any).player.passives).toContain(passiveChoice.id);
    }

    setRandom(0.9);
    game.rerollLevelUp();
    expect((game as any).player.rerolls).toBe(1);
  });
});
