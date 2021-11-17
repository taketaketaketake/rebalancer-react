import { Allocation } from "./allocation";
import { Asset } from "./asset";
import { Coin } from "./coin";
import { Trade, TradeBuilder } from "./tradebuilder";

function getUnits(
    pct: number,
    totalValueUsd: number,
    coinUsdPrice: number,
): number {

    return pct * totalValueUsd / coinUsdPrice
}

function getTotalVolueUsd(
    assets: Asset[],
    coins: { [key: string]: Coin; },
): number {

    return assets.reduce((total, asset) => {
        return total + asset.computeUsdValue(coins[asset.symbol].priceUsd)
    }, 0)
}

function getAllocationsFromAssets(
    assets: Asset[],
    totalValudUsd: number,
    coins: { [key: string]: Coin; },
): { [key: string]: Allocation; } {

    return assets.reduce((map, asset) => {
        const valueUsd = asset.computeUsdValue(coins[asset.symbol].priceUsd)
        const pct = valueUsd / totalValudUsd
        const valueBtc = valueUsd / coins["BTC"].priceUsd
        map[asset.symbol] = new Allocation(asset.symbol, pct, valueUsd, valueBtc)
        return map
    }, {} as { [key: string]: Allocation; })
}

function buildAllocations(
    targetPcts: number[],
    coins: string[],
    totalValudUsd: number,
    btc: Coin,
): { [key: string]: Allocation; } {

    expect(coins.length).toBe(targetPcts.length)

    return coins.reduce((map, symbol, i) => {
        const valueUsd = totalValudUsd * targetPcts[i]
        const valueBtc = valueUsd / btc.priceUsd
        map[symbol] = new Allocation(symbol, targetPcts[i], valueUsd, valueBtc)
        return map
    }, {} as { [key: string]: Allocation; })
}

function assertTrade(actual: Trade, expected: Trade) {
    expect(actual.symbol).toEqual(expected.symbol)
    expect(actual.units).toBeCloseTo(expected.units, 10)
}

test('buyOneCoin', async () => {
    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 0.5),
        new Asset("ETH", 5),
    ]

    // 100% of the assets are in the hot wallet, so we compute the allocations
    // only from the assets
    const sumUsd = getTotalVolueUsd(hotAssets, coins)
    const allocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    // Equal-weight allocation
    // ETH will need to be bought
    const targetAllocations = buildAllocations(
        [0.5, 0.5], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, allocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades()
    expect(trades.length).toBe(1)
    assertTrade(trades[0], new Trade("ETH",
        getUnits(allocations["ETH"].pct - 0.5, sumUsd, coins["ETH"].priceUsd), 0))

    // Should be negative for a buy
    expect(trades[0].units).toBeLessThan(0)
})

test('sellOneCoin', async () => {
    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 0.1),
        new Asset("ETH", 50),
    ]

    // 100% of the assets are in the hot wallet, so we compute the allocations
    // only from the assets
    const sumUsd = getTotalVolueUsd(hotAssets, coins)
    const allocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    // Equal-weight allocation
    // ETH will need to be sold
    const targetAllocations = buildAllocations(
        [0.5, 0.5], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, allocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades()
    expect(trades.length).toBe(1)
    assertTrade(trades[0], new Trade("ETH",
        getUnits(allocations["ETH"].pct - 0.5, sumUsd, coins["ETH"].priceUsd), 0))

    // Should be positive for a sell
    expect(trades[0].units).toBeGreaterThanOrEqual(0)
})

test('notEnoughCoinsInHotWallet', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 0.5),
        new Asset("ETH", 5),
    ]

    const sumUsd = 5000
    const curentAllocations = buildAllocations(
        [0.8, 0.2], ["BTC", "ETH"], sumUsd, coins["BTC"])

    // Switch allocations. ETH will need to be bought, but not enough BTC 
    // is in the hot wallet
    const targetAllocations = buildAllocations(
        [0.2, 0.8], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, curentAllocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades();

    // Should have one phony trade with how many BTC should be moved from 
    // cold storage, and another one to buy ETH.
    expect(trades.length).toBe(2);

    const unitsBTC = getUnits(
        curentAllocations["BTC"].pct - targetAllocations["BTC"].pct,
        sumUsd,
        coins["BTC"].priceUsd);
    assertTrade(trades[0], new Trade("BTC", unitsBTC, unitsBTC - hotAssets[0].total));

    const unitsETH = getUnits(
        curentAllocations["ETH"].pct - targetAllocations["ETH"].pct,
        sumUsd,
        coins["ETH"].priceUsd)
    assertTrade(trades[1], new Trade("ETH", unitsETH, 0));
})

test('noCoinInHotWallet', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    // No ETH in hot wallet
    const hotAssets = [
        new Asset("BTC", 1),
    ]

    // Most of the ETH are in cold storage
    const sumUsd = 5000
    const curentAllocations = buildAllocations(
        [0.2, 0.8], ["BTC", "ETH"], sumUsd, coins["BTC"])

    // Switch allocations. ETH will need to be sold, but there is none
    // in the hot wallet
    const targetAllocations = buildAllocations(
        [0.8, 0.2], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, curentAllocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades();

    // Should have one phony trade with how many ETH should be moved from 
    // cold storage
    expect(trades.length).toBe(1);

    // ETH units should be the missing units to allow rebalancing, that is, the delta 
    // between the current and target allocation
    const unitsETH = getUnits(
        curentAllocations["ETH"].pct - targetAllocations["ETH"].pct,
        sumUsd,
        coins["ETH"].priceUsd)
    assertTrade(trades[0], new Trade("ETH", unitsETH, unitsETH));
})

test('buyNewCoin', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
        "ripple": new Coin("XRP", 15000, 0.3),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    // Missing XRP in assets
    const hotAssets = [
        new Asset("BTC", 10),
        new Asset("ETH", 5),
    ]

    const sumUsd = 5000
    const curentAllocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    const targetAllocations = buildAllocations(
        [0.4, 0.4, 0.2], ["BTC", "ETH", "ripple"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, curentAllocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades()
    expect(trades.length).toBe(2)
    assertTrade(trades[0], new Trade("ETH",
        getUnits(curentAllocations["ETH"].pct - 0.4, sumUsd, coins["ETH"].priceUsd), 0))
    assertTrade(trades[1], new Trade("ripple",
        getUnits(-0.2, sumUsd, coins["ripple"].priceUsd), 0))

    // Should be negative for a buy
    expect(trades[0].units).toBeLessThan(0)
    expect(trades[1].units).toBeLessThan(0)
})

test('liquidateCoinCompletely', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
        "ripple": new Coin("XRP", 15000, 0.3),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 1),
        new Asset("ETH", 50),
        new Asset("ripple", 50),
    ]

    const sumUsd = 5000
    const curentAllocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    // Remove XRP from target allocations, and allocate more to BTC to trigger
    // a sell of ETH
    const targetAllocations = buildAllocations(
        [0.8, 0.2], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, curentAllocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades()
    expect(trades.length).toBe(2)
    assertTrade(trades[0], new Trade("ETH",
        getUnits(curentAllocations["ETH"].pct - 0.2, sumUsd, coins["ETH"].priceUsd), 0))
    assertTrade(trades[1], new Trade("ripple",
        getUnits(curentAllocations["ripple"].pct, sumUsd, coins["ripple"].priceUsd), 0))

    // Should be positive for a sell
    expect(trades[0].units).toBeGreaterThanOrEqual(0)
    expect(trades[1].units).toBeGreaterThanOrEqual(0)
})

test('noTradeIfAlreadyBalanced', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 1),
        new Asset("ETH", 5),
    ]

    const sumUsd = 5000
    const curentAllocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    // Same allocation for target
    const builder = new TradeBuilder(provider, curentAllocations, curentAllocations, hotAssets)
    const trades = await builder.buildTrades()
    expect(trades.length).toBe(0)
})

test('missingBitcoin', async () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 0.01),
        new Asset("ETH", 50),
    ]

    const sumUsd = 5000
    const curentAllocations = getAllocationsFromAssets(hotAssets, sumUsd, coins)

    // We will need to sell ETH to get BTC
    const targetAllocations = buildAllocations(
        [0.8, 0.2], ["BTC", "ETH"], sumUsd, coins["BTC"])

    const builder = new TradeBuilder(provider, curentAllocations, targetAllocations, hotAssets)
    const trades = await builder.buildTrades()

    expect(trades.length).toBe(1)
    assertTrade(trades[0], new Trade("ETH",
        getUnits(curentAllocations["ETH"].pct - 0.2, sumUsd, coins["ETH"].priceUsd), 0))

    // Should be positive for a sell
    expect(trades[0].units).toBeGreaterThanOrEqual(0)
})

test('no target allocations', () => {

    const coins: { [key: string]: Coin; } = {
        "BTC": new Coin("BTC", 85000, 3000),
        "ETH": new Coin("ETH", 15000, 120),
    }

    const provider = {
        getCoin: async (symbol: string) => coins[symbol],
    }

    const hotAssets = [
        new Asset("BTC", 0.01),
        new Asset("ETH", 50),
    ]
    const curentAllocations = getAllocationsFromAssets(hotAssets, 100, coins)

    // Should not accept an empty target allocations
    expect(() => new TradeBuilder(provider, curentAllocations, {}, hotAssets)).toThrowError();

});
