export interface SynergyChoice {
    path: 'A' | 'B';
    name: string;
    desc: string;
    max: string;
}

export interface WeaponSynergy {
    weapon_id: string;
    choices: SynergyChoice[];
}

export const SYNERGIES: WeaponSynergy[];
