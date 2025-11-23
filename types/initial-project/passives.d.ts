export interface PassiveDefinition {
    id: string;
    name: string;
    icon: string;
    desc: string;
    apply: (player: any, mult: number) => void;
}

export const PASSIVE_DB: PassiveDefinition[];
