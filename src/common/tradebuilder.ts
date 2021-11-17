import { Allocation } from "./allocation";
import { Asset } from "./asset";
import { Coin, CoinProvider } from "./coin";

export class Trade {
    constructor(
        readonly symbol: string,
        readonly units: number,
        readonly missingUnits: number,
    ) { }
}

export class TradeBuilder {

    // Deltas in BTC
    private readonly deltas: { [key: string]: number; }

    constructor(
        private readonly provider: CoinProvider,
        allocations: { [key: string]: Allocation; },
        targetAllocations: { [key: string]: Allocation; },
        private binanceAssets: Asset[],
    ) {

        if (Object.keys(targetAllocations).length == 0) {
            // We don't support empty target allocations because we would not know how to handle that.
            // If we want to sell everything for BTC, we need to pass a target allocation of only BTC set to 100%
            throw new Error("Target allocations can not be empty");
        }
        
        // Compare current allocations to target allocations
        const deltasFromAllocations = Object.keys(allocations).reduce((map, symbol) => {
            if (targetAllocations[symbol] === undefined) {
                // A coin we don't want in the target allocations, 100% extra
                map[symbol] = allocations[symbol].valueBtc
            } else {
                // A positive value is extra, negative is missing
                const diff = allocations[symbol].valueBtc - targetAllocations[symbol].valueBtc
                map[symbol] = diff
            }
            return map
        }, {} as { [key: string]: number; })

        // Check for missing allocations from target allocations
        this.deltas = Object.keys(targetAllocations).reduce((map, symbol) => {
            if (map[symbol] === undefined) {
                // A coin we don't have yet, 100% missing
                map[symbol] = -targetAllocations[symbol].valueBtc
            }
            return map
        }, deltasFromAllocations)
    }

    async buildTrades() {

        const btc = await this.provider.getCoin("BTC")

        // Convert list to map
        const hotAssets = this.binanceAssets.reduce((map, asset) => {
            map[asset.symbol] = asset
            return map
        }, {} as { [key: string]: Asset; })

        // Returns list of trades, including phony trades if we don't have
        // enough assets in hot wallet
        return Object.keys(this.deltas).reduce(async (promiseTrades, symbol) => {
            const trades = await promiseTrades;
            const delta = this.deltas[symbol]

            // No trade if delta is 0
            if (this.isCloseZero(delta)) {
                console.log(`Skip delta ${symbol}: ${delta} BTC`)
                return trades;
            }

            const units = this.getUnits(delta, await this.provider.getCoin(symbol), btc);

            if (delta > 0) {
                // We need to SELL

                // Case where we don't have any of that coin in hot storage
                if (hotAssets[symbol] === undefined) {
                    // Here, the units to trade and the ones missing are the same
                    return trades.concat(new Trade(symbol, units, units));
                }

                // Compute current BTC value of this asset for which we have extra allocation
                const assetBtcValue = await this.getBtcValue(hotAssets[symbol], btc);

                // Case were we don't have enough in hot wallet
                if (assetBtcValue < delta) {
                    const missingUnits = this.getUnits(delta - assetBtcValue,
                        await this.provider.getCoin(symbol), btc);
                    return trades.concat(new Trade(symbol, units, missingUnits));
                }

                // Real sell trade, except for BTC
                if (symbol !== "BTC") {
                    return trades.concat(new Trade(symbol, units, 0))
                }

            } else if (symbol !== "BTC") {
                // We need to BUY
                return trades.concat(new Trade(symbol, units, 0))
            }

            // No new trade
            return trades;

        }, Promise.resolve([] as Trade[]));
    }

    private async getBtcValue(asset: Asset, btc: Coin) {
        const coin = await this.provider.getCoin(asset.symbol);
        return asset.computeUsdValue(coin.priceUsd) / btc.priceUsd
    }

    private getUnits(btcValue: number, coin: Coin, btc: Coin): number {
        return btcValue * btc.priceUsd / coin.priceUsd
    }

    private isCloseZero(n: number): boolean {
        // This method assumes the minimum order size is 0.001 BTC
        // TODO we might need to use another values for different exchange
        // (on binance, it can be obtained with the MIN_NOTIONAL filter).
        // Also, we truncate, meaning that a value of 0.0019 will
        // be truncated to 0.001. 
        const truncated = Math.floor(Math.abs(n) * 1000) / 1000
        return truncated <= 0.001
    }
}