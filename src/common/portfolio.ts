import { Allocation, Allocator } from "./allocation";
import { Assets } from "./assets";
import { CoinProvider } from "./coin";

export interface Entry {
  symbol: string,
  amount: number,
  valueUsd: number,
  targetValueUsd: number,
  pct: number,
  targetPct: number,
}

export class Portfolio {

  allocations: { [key: string]: Allocation; } = {};
  entries: Entry[] = [];
  totalValueUsd: number = 0;

  constructor(
    private readonly provider: CoinProvider,
    private readonly assets: Assets,
    private readonly allocator: Allocator,
  ) { }

  async build() {

    const btc = await this.provider.getCoin("BTC");
    this.totalValueUsd = await this.assets.getTotalValueUsd(this.provider);

    // Compute current allocations
    this.allocations = await this.assets.list.reduce(async (promiseMap, asset) => {
      const map = await promiseMap;
      const coin = await this.provider.getCoin(asset.symbol);
      const valueUsd = asset.computeUsdValue(coin.priceUsd);
      const pct = valueUsd / this.totalValueUsd;
      const valueBtc = valueUsd / btc.priceUsd;
      map[coin.symbol] = new Allocation(coin.symbol, pct, valueUsd, valueBtc);
      return map;
    }, Promise.resolve({} as { [key: string]: Allocation; }));

    // Build entries from target allocations
    const targetEntries = Object.keys(this.allocator.allocations).reduce((entries, symbol) => {
      const asset = this.assets.map[symbol];
      const currentAlloc = this.allocations[symbol];
      const targetAlloc = this.allocator.allocations[symbol];
      const entry: Entry = {
        symbol: symbol,
        amount: asset ? asset.total : 0,
        valueUsd: currentAlloc ? currentAlloc.valueUsd : 0,
        targetValueUsd: targetAlloc.valueUsd,
        pct: currentAlloc ? currentAlloc.pct : 0,
        targetPct: targetAlloc.pct,
      };
      return entries.concat(entry);
    }, [] as Entry[]);

    // Add extra asset we might own that are not in the target allocations
    this.entries = this.assets.list.reduce((entries, asset) => {
      // Skip if we alreay have a target allocations for this asset because it was 
      // already added to the entries list
      if (this.allocator.allocations[asset.symbol]) {
        return entries;
      }
      const currentAlloc = this.allocations[asset.symbol];
      const entry: Entry = {
        symbol: asset.symbol,
        amount: asset.total,
        valueUsd: currentAlloc.valueUsd,
        targetValueUsd: 0,
        pct: currentAlloc.pct,
        targetPct: 0,
      };
      return entries.concat(entry);
    }, targetEntries);

  }
}
