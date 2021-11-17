import { Asset } from "./asset";
import { CoinProvider } from "./coin";

export class Assets {

    readonly map: { [key: string]: Asset; };
    readonly list: Asset[];
    readonly symbols: string[];

    constructor(...lists: Asset[][]) {

        const assets = lists.reduce((all, list) => all.concat(list), []);
        this.map = assets.reduce((assets, asset) => {
            const existing = assets[asset.symbol];
            assets[asset.symbol] = existing ?
                new Asset(asset.symbol, asset.total + existing.total) : asset;
            return assets;
        }, {} as { [key: string]: Asset; });
        this.list = Object.keys(this.map).map((id) => this.map[id]);
        this.symbols = this.list.map(asset => asset.symbol);
    }

    async getTotalValueUsd(provider: CoinProvider) {
        return this.list.reduce(async (total, asset) => {
            const coin = await provider.getCoin(asset.symbol);
            return await total + asset.computeUsdValue(coin.priceUsd);
        }, Promise.resolve(0));
    }

}