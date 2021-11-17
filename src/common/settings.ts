type SettingsKey =
    "binanceApiKey" |
    "binanceApiSecret" |
    "coinsInColdStorage" |
    "initialCoins" |
    "targetIndexType" |
    "targetIndexMarketCapNumberCoins" |
    "targetIndexMarketCapSquared" |
    "targetIndexCustomCoins";

export interface Settings {
    binanceApiKey: string,
    binanceApiSecret: string,
    coinsInColdStorage: StoredCoin[],
    initialCoins: StoredCoin[],
    targetIndexType: IndexType,
    targetIndexMarketCapNumberCoins: number,
    targetIndexMarketCapSquared: boolean,
    targetIndexCustomCoins: StoredCoin[],
}

export interface StoredCoin {
    symbol: string,
    total: number,
}

export type IndexType = "marketCap" | "custom";

export class SettingsStore {

    private set(setting: SettingsKey, value: string) {
        localStorage.setItem("settings." + setting, value);
    }

    private get(setting: SettingsKey): string {
        const item = localStorage.getItem("settings." + setting);
        return item ? item : "";
    }

    private getJsonArray(key: SettingsKey) {
        const value = this.get(key);
        if (!value) {
            return [];
        }
        return JSON.parse(value);
    }

    private getTargetIndexType(): IndexType {
        const value = this.get("targetIndexType");
        if (value !== 'marketCap' && value !== 'custom') {
            return 'marketCap';
        }
        return value;
    }

    private getTargetIndexMarketCapNumberCoins(): number {
        const value = this.get("targetIndexMarketCapNumberCoins");
        if (!value) {
            return 5;
        }
        return Number(value);
    }

    private getTargetIndexMarketCapSquared(): boolean {
        const value = this.get("targetIndexMarketCapSquared");
        // We want to return true by default (for example, when the setting is 
        // initially absent). False will be returned only when explicitely set
        return !(value == 'false');
    }

    save(settings: Settings) {
        this.set("binanceApiKey", settings.binanceApiKey);
        this.set("binanceApiSecret", settings.binanceApiSecret);
        this.set("coinsInColdStorage", JSON.stringify(settings.coinsInColdStorage));
        this.set("initialCoins", JSON.stringify(settings.initialCoins));
        this.set("targetIndexType", settings.targetIndexType);
        this.set("targetIndexMarketCapNumberCoins", settings.targetIndexMarketCapNumberCoins.toString());
        this.set("targetIndexMarketCapSquared", settings.targetIndexMarketCapSquared.toString());
        this.set("targetIndexCustomCoins", JSON.stringify(settings.targetIndexCustomCoins));
    }

    load(): Settings {
        return {
            binanceApiKey: this.get("binanceApiKey"),
            binanceApiSecret: this.get("binanceApiSecret"),
            coinsInColdStorage: this.getJsonArray("coinsInColdStorage"),
            initialCoins: this.getJsonArray("initialCoins"),
            targetIndexType: this.getTargetIndexType(),
            targetIndexMarketCapNumberCoins: this.getTargetIndexMarketCapNumberCoins(),
            targetIndexMarketCapSquared: this.getTargetIndexMarketCapSquared(),
            targetIndexCustomCoins: this.getJsonArray("targetIndexCustomCoins"),
        }
    }
}
