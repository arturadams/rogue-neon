export type WorldColors = {
  cyan: number;
  pink: number;
  orange: number;
  red: number;
  bg: number;
  green: number;
  yellow: number;
  common: number;
  uncommon: number;
  rare: number;
  mythic: number;
  legendary: number;
  cursed: number;
};

export type WorldConfig = {
  spawnZ: number;
  playerZ: number;
  endZone: number;
  laneWidth: number;
  maxWaves: number;
  colors: WorldColors;
};

export const WORLD_CONFIG: WorldConfig = {
  spawnZ: -120,
  playerZ: 40,
  endZone: 50,
  laneWidth: 24,
  maxWaves: 20,
  colors: {
    cyan: 0x00ffff,
    pink: 0xff00ff,
    orange: 0xffaa00,
    red: 0xff0055,
    bg: 0x050510,
    green: 0x00ff00,
    yellow: 0xffee00,
    common: 0xdddddd,
    uncommon: 0x00ff00,
    rare: 0x0088ff,
    mythic: 0xaa00ff,
    legendary: 0xffaa00,
    cursed: 0xff0000,
  },
};
