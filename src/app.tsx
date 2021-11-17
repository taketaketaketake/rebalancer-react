import * as React from "react";
import { Container, Nav, Tab } from "react-bootstrap";
import { Allocator } from "./common/allocation";
import { Asset } from "./common/asset";
import { Assets } from "./common/assets";
import { BinanceClient } from "./common/binanceclient";
import { Coincap } from "./common/coincap";
import { CustomAllocator } from "./common/customallocator";
import { MarketCapAllocator } from "./common/marketcapallocator";
import { Portfolio } from "./common/portfolio";
import { Settings, SettingsStore } from "./common/settings";
import { Trade, TradeBuilder } from "./common/tradebuilder";
import { IndexComp } from "./components/index";
import { PortfolioComp } from "./components/portfolio";
import { SettingsComp } from "./components/settings";

interface AppState {
    coincap: Coincap,
    client: BinanceClient,
    binanceAssets: Asset[],
    portfolio: Portfolio,
    trades: Trade[],
    hodl: number,
    error?: Error,
    mounted: boolean,
}

export class App extends React.Component<{}, AppState> {

    private readonly settingsStore = new SettingsStore();
    private settings = this.settingsStore.load();

    constructor(props: {}) {
        super(props);
        this.saveSettings = this.saveSettings.bind(this);
        this.handleSettingsUpdate = this.handleSettingsUpdate.bind(this);
    }

    saveSettings() {
        this.settingsStore.save(this.settings);
    }

    async componentDidMount() {
        // This allows to quickly have a state to show the menu, even if the rest is 
        // still loading. The alternative would be to initialize all the state variables
        // with default values so that the state is present at construction.
        this.setState({ mounted: true });
        // To handle refresh and quit. See https://stackoverflow.com/questions/39084924/componentwillunmount-not-being-called-when-refreshing-the-current-page
        window.addEventListener('beforeunload', this.saveSettings);
        try {
            await this.loadExternalData();
            this.loadLocalData();
        } catch (e) {
            this.setState({ error: e });
        }
    }

    componentWillUnmount() {
        this.saveSettings();
        window.removeEventListener('beforeunload', this.saveSettings);
    }

    async loadExternalData() {
        const binanceKey = this.settings.binanceApiKey;
        const binanceSecret = this.settings.binanceApiSecret;
        if (!binanceKey || !binanceSecret) {
            throw new Error('Binance settings are missing!');
        }

        console.log(">>>>>> COINCAP " + this.settings.targetIndexMarketCapNumberCoins);
        const coincap = new Coincap(this.settings.targetIndexMarketCapNumberCoins);
        const client = new BinanceClient(binanceKey, binanceSecret);
        const [, binanceAssets] = await Promise.all([
            coincap.init(),
            client.loadAssets(),
        ]);

        this.setState({ coincap, client, binanceAssets });
    }

    async loadLocalData() {

        const coldAssets = this.settings.coinsInColdStorage.map(
            coin => new Asset(coin.symbol, coin.total));
        const assets = new Assets(coldAssets, this.state.binanceAssets);
        const totalValueUsd = await assets.getTotalValueUsd(this.state.coincap);
        console.log(">>>>>> ASSETS VALUE");
        console.log(totalValueUsd);
        console.log(">>>>>> MERGED ASSETS");
        console.log(assets);

        const btc = await this.state.coincap.getCoin("BTC");
        const allocator: Allocator = this.settings.targetIndexType === 'marketCap' ?
            new MarketCapAllocator(
                this.state.coincap.topCoins,
                btc,
                totalValueUsd,
                this.settings.targetIndexMarketCapSquared) :
            new CustomAllocator(
                this.settings.targetIndexCustomCoins,
                btc,
                totalValueUsd);
        console.log(">>>>>> TARGET");
        console.log(allocator.allocations);

        const portfolio = new Portfolio(this.state.coincap, assets, allocator);
        await portfolio.build();
        console.log(">>>>>> PORTFOLIO");
        console.log(portfolio.allocations);

        const tradeBuilder = new TradeBuilder(
            this.state.coincap, portfolio.allocations, allocator.allocations, this.state.binanceAssets);
        const trades = await tradeBuilder.buildTrades();
        console.log(">>>>>>>>> TRADES");
        console.log(trades);

        const hodlAssets = new Assets(
            this.settings.initialCoins.map(coin => new Asset(coin.symbol, coin.total)));
        const hodl = await hodlAssets.getTotalValueUsd(this.state.coincap);
        console.log(">>>>>>>> HODL: " + hodl);

        this.setState({ portfolio, trades, hodl });
    }

    async handleSettingsUpdate(partial: Partial<Settings>) {
        this.settings = { ...this.settings, ...partial };
        try {
            if (partial.binanceApiKey != undefined ||
                partial.binanceApiSecret != undefined ||
                partial.targetIndexMarketCapNumberCoins != undefined) {
                await this.loadExternalData();
            }
            this.loadLocalData();
            this.setState({ error: undefined });
        } catch (e) {
            this.setState({ error: e });
        }
    }

    render() {
        // This should not last long...
        if (this.state == null) {
            return null;
        }

        // Here, we could have an incomplete state, but the menu will still be display and 
        // settings should be accessible.
        return (
            <Container id="main" fluid={true}>
                <Tab.Container defaultActiveKey="first">
                    <div className="main-sidebar">
                        <Nav variant="pills" className="flex-column">
                            <Nav.Item>
                                <Nav.Link eventKey="first">Portfolio</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="second">Index</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="third">Settings</Nav.Link>
                            </Nav.Item>
                        </Nav>
                    </div>
                    <div className="main-content">
                        <Tab.Content>
                            <Tab.Pane eventKey="first">
                                <PortfolioComp
                                    portfolio={this.state.portfolio}
                                    trades={this.state.trades}
                                    client={this.state.client}
                                    hodl={this.state.hodl}
                                    error={this.state.error} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="second">
                                <IndexComp settings={this.settings}
                                    handleSettingsUpdate={this.handleSettingsUpdate} />
                            </Tab.Pane>
                            <Tab.Pane eventKey="third">
                                <SettingsComp settings={this.settings}
                                    handleSettingsUpdate={this.handleSettingsUpdate} />
                            </Tab.Pane>
                        </Tab.Content>
                    </div>
                </Tab.Container>
            </Container>
        );
    }
}