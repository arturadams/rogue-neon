export interface GameColors {
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
}

export interface GameConfig {
    spawnZ: number;
    playerZ: number;
    endZone: number;
    laneWidth: number;
    maxWaves: number;
    colors: GameColors;
}

export const CONFIG: GameConfig;
