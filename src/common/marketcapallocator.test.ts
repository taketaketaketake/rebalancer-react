import { Allocation } from "./allocation";
import { Coin } from "./coin";
import { MarketCapAllocator } from "./marketcapallocator";

test('basic', () => {

  const topCoins = [
    new Coin("BTC", 85000, 3000),
    new Coin("ETH", 15000, 120),
    new Coin("XRP", 14000, 0.30),
  ]

  const sum = topCoins.reduce((total, coin) => total + coin.marketCapUsd, 0);
  const pcts = topCoins.map(coin => coin.marketCapUsd / sum);
  const totalValueUsd = 10000;

  const allocator = new MarketCapAllocator(topCoins, topCoins[0], totalValueUsd, false);
  const expectedAllocations = {
    "BTC": new Allocation("BTC",
      pcts[0], pcts[0] * totalValueUsd, pcts[0] * totalValueUsd / topCoins[0].priceUsd),
    "ETH": new Allocation("ETH",
      pcts[1], pcts[1] * totalValueUsd, pcts[1] * totalValueUsd / topCoins[0].priceUsd),
    "XRP": new Allocation("XRP",
      pcts[2], pcts[2] * totalValueUsd, pcts[2] * totalValueUsd / topCoins[0].priceUsd),
  }
  expect(allocator.allocations).toEqual(expectedAllocations);

})

test('squared', () => {

  const topCoins = [
    new Coin("BTC", 85000, 3000),
    new Coin("ETH", 15000, 120),
    new Coin("XRP", 14000, 0.30),
  ]

  const sum = topCoins.reduce((total, coin) => total + Math.sqrt(coin.marketCapUsd), 0);
  const pcts = topCoins.map(coin => Math.sqrt(coin.marketCapUsd) / sum);
  const totalValueUsd = 10000;

  const allocator = new MarketCapAllocator(topCoins, topCoins[0], totalValueUsd, true);
  const expectedAllocations = {
    "BTC": new Allocation("BTC",
      pcts[0], pcts[0] * totalValueUsd, pcts[0] * totalValueUsd / topCoins[0].priceUsd),
    "ETH": new Allocation("ETH",
      pcts[1], pcts[1] * totalValueUsd, pcts[1] * totalValueUsd / topCoins[0].priceUsd),
    "XRP": new Allocation("XRP",
      pcts[2], pcts[2] * totalValueUsd, pcts[2] * totalValueUsd / topCoins[0].priceUsd),
  }
  expect(allocator.allocations).toEqual(expectedAllocations);

})