export interface WeaponBaseStats {
    dmg: number;
    cd: number;
    range?: number;
    speed?: number;
    count?: number;
    spread?: number;
    slow?: number;
    knockback?: number;
    pierce?: number;
    homing?: boolean;
    width?: number;
    beam?: boolean;
    chain?: number;
    area?: number;
    puddle?: boolean;
    duration?: number;
    deploy?: string;
    cone?: boolean;
    tick?: boolean;
    explode?: number;
    pull?: boolean;
    particles?: boolean;
    summon?: string;
    boomerang?: boolean;
    push?: number;
    delete_chance?: number;
    gold_hit?: boolean;
}

export interface WeaponDefinition {
    id: string;
    name: string;
    type: string;
    scaling: string;
    icon: string;
    base: WeaponBaseStats;
    color: number;
    desc: string;
}

export const WEAPONS: WeaponDefinition[];
