export declare enum BoostType {
    REGEN_SPEED = "REGEN_SPEED",
    EXTRA_CAPACITY = "EXTRA_CAPACITY",
    UNLIMITED = "UNLIMITED"
}
export declare class EnergyBoost {
    id: string;
    userId: string;
    type: BoostType;
    multiplier: number;
    expiresAt: Date;
    createdAt: Date;
}
