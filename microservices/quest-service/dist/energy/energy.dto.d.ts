import { BoostType } from './entities/boost.entity';
export declare class ConsumeEnergyDto {
    userId: string;
    amount: number;
}
export declare class RefillEnergyDto {
    userId: string;
    amount: number;
}
export declare class GiftEnergyDto {
    fromUserId: string;
    toUserId: string;
    amount: number;
}
export declare class ApplyBoostDto {
    userId: string;
    type: BoostType;
    multiplier: number;
    durationMinutes: number;
}
