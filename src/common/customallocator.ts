import { Allocation, Allocator } from "./allocation";
import { Coin } from "./coin";
import { StoredCoin } from "./settings";

export class CustomAllocator implements Allocator {

    readonly allocations: { [key: string]: Allocation; }

    constructor(
        readonly coins: StoredCoin[],
        readonly btc: Coin,
        readonly portfolioValueUsd: number,
    ) {

        const sum = coins.reduce((total, coin) => total + coin.total, 0);
        this.allocations = coins.reduce((map, coin) => {
            const pct = coin.total / sum;
            const valueUsd = this.portfolioValueUsd * pct;
            const valueBtc = valueUsd / btc.priceUsd;
            map[coin.symbol] = new Allocation(coin.symbol, pct, valueUsd, valueBtc)
            return map
        }, {} as { [key: string]: Allocation; });
    }

}