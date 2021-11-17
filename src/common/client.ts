import { binance } from 'ccxt';
import { Settings } from './settings';

export async function test() {

    const settings = new Settings();

    const exchange = new binance({
        apiKey: settings.binanceApiKey,
        secret: settings.binanceApiSecret,
        enableRateLimit: true,
        options: {
            'adjustForTimeDifference': true,
        },
    });

    const markets = await exchange.load_markets()
    console.log(">>>>>>>>>>>> MARKETS: " + JSON.stringify(markets['ETH/BTC'], null, 2));

    const symbol = 'XRP/BTC';
    const type = 'market';
    const side = 'buy';
    const amount = 100.0;
    const params = {
        'test': true,
    };

    // const result = await exchange.createOrder(symbol, type, side, amount, undefined, params);
    // console.log(">>>>>>>>>>>> RESULT: " + JSON.stringify(result));    

}
