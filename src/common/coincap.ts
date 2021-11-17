import axios from 'axios';
import { Coin, CoinProvider } from './coin';

interface CoincapData {
    id: string,
    rank: string,
    symbol: string,
    name: string,
    priceUsd: string,
    marketCapUsd: string,
}

export class Coincap implements CoinProvider {

    static readonly IGNORE_LIST = ["USDT", "USDC", "TUSD"];

    readonly topCoins: Coin[] = [];

    private readonly client = axios.create({
        baseURL: 'https://api.coincap.io/v2',
    });

    private readonly map: { [key: string]: CoincapData } = {};

    private readonly batchSize: number = 100;

    private offset: number = 0;

    private completed: boolean = false;

    constructor(
        readonly numberTopCoins: number,
    ) {
    }

    async init() {
        // Load a first batch
        await this.loadBatch();
        // In case not all top coins were loaded in the first batch (unlikely)
        while (this.topCoins.length < this.numberTopCoins && !this.completed) {
            await this.loadBatch();
        }
        if (this.topCoins.length < this.numberTopCoins) {
            throw new Error('Could not load all top coins');
        }
    }

    async getCoin(symbol: string) {
        while (!this.map[symbol] && !this.completed) {
            await this.loadBatch();
        }
        if (!this.map[symbol]) {
            throw new Error(`Could not find ${symbol}`);
        }
        const coindata = this.map[symbol];
        return new Coin(coindata.symbol, Number(coindata.marketCapUsd), Number(coindata.priceUsd));
    }

    private async loadBatch() {
        const loaded = await this.loadCoins(this.batchSize, this.offset);
        if (loaded == this.batchSize) {
            this.offset += this.batchSize;
        } else {
            this.completed = true;
        }
    }

    private async loadCoins(n: number, start: number) {
        const response = await this.client.get(`/assets?limit=${n}&offset=${start}`)
        // TODO check http return code
        const list = response.data.data as CoincapData[];
        for (const coindata of list) {
            if (!this.map[coindata.symbol]) {
                this.map[coindata.symbol] = coindata;
            } // else: TODO use a map of list instead to keep duplicates?

            // Keep coin if NOT in ignore list
            if (this.topCoins.length < this.numberTopCoins &&
                Coincap.IGNORE_LIST.indexOf(coindata.symbol) == -1) {
                this.topCoins.push(await this.getCoin(coindata.symbol));
            }
        }
        return list.length;
    }
}