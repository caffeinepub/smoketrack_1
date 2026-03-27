import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserSettings {
    pricePerCigarette: number;
    notificationsEnabled: boolean;
    dailyLimitGoal: bigint;
}
export interface SmokingLog {
    id: bigint;
    date: string;
    pricePerUnit: number;
    cigarettesCount: bigint;
    totalSpent: number;
    timestamp: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addLog(date: string, cigarettesCount: bigint, pricePerUnit: number): Promise<SmokingLog>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteLog(id: bigint): Promise<SmokingLog>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLogs(): Promise<Array<SmokingLog>>;
    getSettings(): Promise<UserSettings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveSettings(settings: UserSettings): Promise<void>;
}
