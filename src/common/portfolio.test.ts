import { Allocation } from "./allocation";
import { Asset } from "./asset";
import { Assets } from "./assets";
import { Coin } from "./coin";
import { Entry, Portfolio } from "./portfolio";

test('basic', async () => {

  const coins: { [key: string]: Coin } = {
    "BTC": new Coin("BTC", 85000, 3000),
    "ETH": new Coin("ETH", 15000, 120),
  }

  const provider = {
    getCoin: async (symbol: string) => coins[symbol],
  }

  // We currently have BTC and ETH
  const assets = [
    new Asset("BTC", 0.5),
    new Asset("ETH", 5),
  ]

  const totalValueUsd = assets.reduce(
    (total, asset) => total + asset.total * coins[asset.symbol].priceUsd, 0);
  const totalValueBtc = totalValueUsd / coins["BTC"].priceUsd;

  // Target allocations is half BTC, half ETH
  const allocator = {
    allocations: {
      "BTC": new Allocation("BTC", 0.5, totalValueUsd * 0.5, totalValueBtc * 0.5),
      "ETH": new Allocation("ETH", 0.5, totalValueUsd * 0.5, totalValueBtc * 0.5),
    },
  }

  // Build portfolio
  const portfolio = new Portfolio(provider, new Assets(assets), allocator);
  await portfolio.build();

  // Expected current allocations should only contains current assets
  const expectedCurrentAllocations = assets.reduce((allocs, asset) => {
    const valueUsd = asset.total * coins[asset.symbol].priceUsd;
    allocs[asset.symbol] = new Allocation(
      asset.symbol, valueUsd / totalValueUsd, valueUsd, valueUsd / coins["BTC"].priceUsd);
    return allocs;
  }, {} as { [key: string]: Allocation; });
  expect(portfolio.allocations).toEqual(expectedCurrentAllocations);

  const expectedEntries: Entry[] = [
    {
      symbol: "BTC",
      amount: assets[0].total,
      valueUsd: expectedCurrentAllocations["BTC"].valueUsd,
      targetValueUsd: allocator.allocations["BTC"].valueUsd,
      pct: expectedCurrentAllocations["BTC"].pct,
      targetPct: allocator.allocations["BTC"].pct,
    },
    {
      symbol: "ETH",
      amount: assets[1].total,
      valueUsd: expectedCurrentAllocations["ETH"].valueUsd,
      targetValueUsd: allocator.allocations["ETH"].valueUsd,
      pct: expectedCurrentAllocations["ETH"].pct,
      targetPct: allocator.allocations["ETH"].pct,
    },
  ];
  expect(portfolio.entries).toEqual(expectedEntries);

});

test('missingTargetCoinWithExtraCoin', async () => {

  const coins: { [key: string]: Coin } = {
    "BTC": new Coin("BTC", 85000, 3000),
    "ETH": new Coin("ETH", 15000, 120),
  }

  const provider = {
    getCoin: async (symbol: string) => coins[symbol],
  }

  // We currently have BTC and ETH, but no XRP
  const assets = [
    new Asset("BTC", 0.5),
    new Asset("ETH", 5),
  ]

  const totalValueUsd = assets.reduce(
    (total, asset) => total + asset.total * coins[asset.symbol].priceUsd, 0);
  const totalValueBtc = totalValueUsd / coins["BTC"].priceUsd;

  // Target allocations is half BTC, half XRP (which we don't own), and no ETH
  const allocator = {
    allocations: {
      "BTC": new Allocation("BTC", 0.5, totalValueUsd * 0.5, totalValueBtc * 0.5),
      "XRP": new Allocation("XRP", 0.5, totalValueUsd * 0.5, totalValueBtc * 0.5),
    },
  }

  // Build portfolio
  const portfolio = new Portfolio(provider, new Assets(assets), allocator);
  await portfolio.build();

  // Expected current allocations should only contains current assets
  const expectedCurrentAllocations = assets.reduce((allocs, asset) => {
    const valueUsd = asset.total * coins[asset.symbol].priceUsd;
    allocs[asset.symbol] = new Allocation(
      asset.symbol, valueUsd / totalValueUsd, valueUsd, valueUsd / coins["BTC"].priceUsd);
    return allocs;
  }, {} as { [key: string]: Allocation; });
  expect(portfolio.allocations).toEqual(expectedCurrentAllocations);

  // Expected entries should first list target allocations, followed by any 
  // extra allocation we might have
  const expectedEntries: Entry[] = [
    {
      symbol: "BTC",
      amount: assets[0].total,
      valueUsd: expectedCurrentAllocations["BTC"].valueUsd,
      targetValueUsd: allocator.allocations["BTC"].valueUsd,
      pct: expectedCurrentAllocations["BTC"].pct,
      targetPct: allocator.allocations["BTC"].pct,
    },
    {
      symbol: "XRP",
      amount: 0,
      valueUsd: 0,
      targetValueUsd: allocator.allocations["XRP"].valueUsd,
      pct: 0,
      targetPct: allocator.allocations["XRP"].pct,
    },
    {
      symbol: "ETH",
      amount: assets[1].total,
      valueUsd: expectedCurrentAllocations["ETH"].valueUsd,
      targetValueUsd: 0,
      pct: expectedCurrentAllocations["ETH"].pct,
      targetPct: 0,
    },
  ];
  expect(portfolio.entries).toEqual(expectedEntries);

});