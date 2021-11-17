export class Asset {

    constructor(readonly symbol: string, readonly total: number) {
    }

    computeUsdValue(unitPriceUsd: number): number {
        return this.total * unitPriceUsd;
    }
}