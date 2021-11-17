import { Allocation, Allocator } from "./allocation";
import { Coin } from "./coin";

export class MarketCapAllocator implements Allocator {

  readonly allocations: { [key: string]: Allocation; }

  constructor(
    readonly topCoins: Coin[],
    readonly btc: Coin,
    readonly portfolioValueUsd: number,
    readonly squared: boolean,
  ) {

    // Compute total market cap for top coins
    const totalMarketCap = topCoins.reduce((total, coin) =>
      total + this.getMarketCap(coin), 0);

    // Compute allocations
    this.allocations = topCoins.reduce((map, coin) => {
      const pct = this.getMarketCap(coin) / totalMarketCap;
      const valueUsd = this.portfolioValueUsd * pct;
      const valueBtc = valueUsd / btc.priceUsd;
      map[coin.symbol] = new Allocation(coin.symbol, pct, valueUsd, valueBtc);
      return map;
    }, {} as { [key: string]: Allocation; })
  }

  private getMarketCap(coin: Coin) {
    return this.squared ? Math.sqrt(coin.marketCapUsd) : coin.marketCapUsd;
  }
}