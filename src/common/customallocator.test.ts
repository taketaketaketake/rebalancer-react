import { Allocation } from "./allocation";
import { Coin } from "./coin";
import { CustomAllocator } from "./customallocator";
import { StoredCoin } from "./settings";

test('basic', () => {

    const coins: StoredCoin[] = [
        { symbol: "BTC", "total": 2 },
        { symbol: "ETH", "total": 1 },
        { symbol: "XRP", "total": 1 },
    ];
    const btc = new Coin("BTC", 1000000, 5000);

    const allocator = new CustomAllocator(coins, btc, 100);

    const expectedAllocations = {
        "BTC": new Allocation("BTC", 0.5, 50, 0.5 * 100 / btc.priceUsd),
        "ETH": new Allocation("ETH", 0.25, 25, 0.25 * 100 / btc.priceUsd),
        "XRP": new Allocation("XRP", 0.25, 25, 0.25 * 100 / btc.priceUsd),
    }

    expect(allocator.allocations).toEqual(expectedAllocations);

});