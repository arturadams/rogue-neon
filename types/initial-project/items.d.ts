export interface ItemDefinition {
    id: string;
    name: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'cursed';
    icon: string;
    effect: string;
}

export const ITEMS: ItemDefinition[];
