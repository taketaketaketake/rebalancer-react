import { Asset } from "./asset";
import { Assets } from "./assets";
import { Coin } from "./coin";

test('merge', () => {

    const hot = [new Asset("BTC", 10), new Asset("ETH", 10)];
    const cold = [new Asset("BTC", 10), new Asset("XRP", 10)];

    const assets = new Assets(hot, cold);

    const expectedMap = {
        'BTC': new Asset("BTC", 20),
        'ETH': new Asset("ETH", 10),
        'XRP': new Asset("XRP", 10),
    };
    expect(assets.map).toEqual(expectedMap);

    const expectedList = [
        new Asset("BTC", 20),
        new Asset("ETH", 10),
        new Asset("XRP", 10)];
    expect(assets.list).toEqual(expectedList);

    const expectedSybols = ['BTC', 'ETH', 'XRP'];
    expect(assets.symbols).toEqual(expectedSybols);
});

test('totalValueUsd', async () => {

    const hot = [new Asset("BTC", 20), new Asset("ETH", 10)];
    const assets = new Assets(hot);

    const coins: { [key: string]: Coin } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const expectedTotalValueUsd =
        hot[0].total * coins["BTC"].priceUsd + hot[1].total * coins["ETH"].priceUsd
    const totalValueUsd = await assets.getTotalValueUsd(provider);
    expect(totalValueUsd).toEqual(expectedTotalValueUsd);
});