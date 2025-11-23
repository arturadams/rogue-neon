import { GameColors } from './config';

export interface RarityWeight {
    id: 'common' | 'uncommon' | 'rare' | 'mythic' | 'legendary' | 'cursed';
    weight: number;
    mult: number;
    color: GameColors[keyof GameColors];
    name: string;
}

export const RARITY_WEIGHTS: RarityWeight[];
