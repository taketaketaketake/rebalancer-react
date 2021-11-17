export class Coin {
    constructor(
        readonly symbol: string,
        readonly marketCapUsd: number,
        readonly priceUsd: number) { }
}

export interface CoinProvider {
    getCoin(symbol: string): Promise<Coin>;
}