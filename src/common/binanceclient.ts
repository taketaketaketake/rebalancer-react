import { binance, Market } from 'ccxt';
import { Asset } from './asset';
import { Trade } from './tradebuilder';

export class BinanceClient {

    private readonly IGNORE_LIST = ['info', 'free', 'used', 'total'];

    private readonly client = new binance({
        apiKey: this.apiKey,
        secret: this.apiSecret,
        enableRateLimit: true,
        options: {
            'adjustForTimeDifference': true, // TODO setting
        },
    });

    constructor(
        private readonly apiKey: string,
        private readonly apiSecret: string,
    ) { }

    async loadAssets() {
        try {
            const balances = await this.client.fetchBalance();
            return Object.keys(balances).reduce((assets, symbol) => {
                const balance = balances[symbol];
                if (this.IGNORE_LIST.includes(symbol) || balance.free <= 0) {
                    return assets;
                }
                console.log(symbol + ": " + balance.free);
                return assets.concat(new Asset(symbol, Number(balance.free)));
            }, [] as Asset[]);

        } catch (e) {
            console.log(`>>>>>>>>> FETCHING ERROR ${e.message}...`);
            return [];
        }
    }

    async trade(trade: Trade) {

        const markets = await this.client.loadMarkets();

        const pair = `${trade.symbol}/BTC`;
        const type = 'market';
        const side = trade.units > 0 ? "sell" : "buy";
        const amount = this.truncate(Math.abs(trade.units), this.getStepSize(markets[pair]));
        // TODO settings
        const params = {
            'test': true,
        };
        return this.client.createOrder(pair, type, side, amount, undefined, params);
    }

    private truncate(n: number, stepSize: number) {
        const pow = 1 / stepSize
        return Math.floor(n * pow) / pow
    }

    private getStepSize(market: Market) {
        const filters = market.info.filters as any[];
        const filterLotSize = filters.find((filter) => {
            return filter.filterType === "LOT_SIZE"
        })
        return Number(filterLotSize.stepSize)
    }
}