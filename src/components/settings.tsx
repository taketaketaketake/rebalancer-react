import * as React from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Settings } from "../common/settings";
import { Coin, CoinsComp, CoinsUtils } from "./coins";

interface SettingsProps {
    settings: Settings,
    handleSettingsUpdate: (settings: Partial<Settings>) => Promise<void>,
}

interface SettingsState {
    binanceApiKey: string,
    binanceApiSecret: string,
    coinsInColdStorage: Coin[],
    initialCoins: Coin[],
    dirty: boolean,
    coinsInColdStorageValid: boolean,
    initialCoinsValid: boolean,
}

export class SettingsComp extends React.Component<SettingsProps, SettingsState> {

    constructor(props: SettingsProps) {
        super(props);
        this.state = this.initialState();

        this.handleBinanceApiKeyUpdate = this.handleBinanceApiKeyUpdate.bind(this);
        this.handleBinanceApiSecretUpdate = this.handleBinanceApiSecretUpdate.bind(this);
        this.handleCoinsInColdStorageUpdate = this.handleCoinsInColdStorageUpdate.bind(this);
        this.handleInitialCoinsUpdate = this.handleInitialCoinsUpdate.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    initialState() {
        return {
            binanceApiKey: this.props.settings.binanceApiKey,
            binanceApiSecret: this.props.settings.binanceApiSecret,
            coinsInColdStorage: CoinsUtils.mapStoredCoins(this.props.settings.coinsInColdStorage),
            initialCoins: CoinsUtils.mapStoredCoins(this.props.settings.initialCoins),
            dirty: false,
            coinsInColdStorageValid: true,
            initialCoinsValid: true,
        }
    }

    isValidCoins(coins: Coin[]) {
        // Valid if we have no coin with an empty total
        return !coins.find(
            coin => !coin.total || coin.total.trim().length == 0);
    }

    // TODO find proper type to use for this event
    handleBinanceApiKeyUpdate(e: any) {
        const newState = { binanceApiKey: e.target.value };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    // TODO find proper type to use for this event
    handleBinanceApiSecretUpdate(e: any) {
        const newState = { binanceApiSecret: e.target.value };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    handleCoinsInColdStorageUpdate(coins: Coin[]) {
        const coinsInColdStorageValid = this.isValidCoins(coins);
        const newState = { coinsInColdStorage: coins, coinsInColdStorageValid };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    handleInitialCoinsUpdate(coins: Coin[]) {
        const initialCoinsValid = this.isValidCoins(coins);
        const newState = { initialCoins: coins, initialCoinsValid };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    getChangedSettings(state: Partial<SettingsState>) {
        const changed: Partial<Settings> = {};
        if (state.binanceApiKey != undefined && this.props.settings.binanceApiKey != state.binanceApiKey) {
            changed.binanceApiKey = state.binanceApiKey;
        }
        if (state.binanceApiSecret != undefined && this.props.settings.binanceApiSecret != state.binanceApiSecret) {
            changed.binanceApiSecret = state.binanceApiSecret;
        }
        if (state.coinsInColdStorage && !CoinsUtils.isCoinsEqual(
            this.props.settings.coinsInColdStorage, state.coinsInColdStorage)) {
            changed.coinsInColdStorage = CoinsUtils.mapCoins(state.coinsInColdStorage);
        }
        if (state.initialCoins && !CoinsUtils.isCoinsEqual(
            this.props.settings.initialCoins, state.initialCoins)) {
            changed.initialCoins = CoinsUtils.mapCoins(state.initialCoins);
        }
        return changed;
    }

    isChanged(state: Partial<SettingsState>) {
        const changed = this.getChangedSettings(state);
        return Object.keys(changed).length != 0;
    }

    async handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!this.state.coinsInColdStorageValid ||
            !this.state.initialCoinsValid ||
            !this.state.dirty) {
            return;
        }

        const changed = this.getChangedSettings(this.state);
        await this.props.handleSettingsUpdate(changed);
        this.setState({ dirty: false });
    }

    handleReset() {
        this.setState(this.initialState());
    }

    render() {
        return (
            <Container fluid={true}>
                <h1>Settings</h1>
                <Form noValidate onSubmit={this.handleSave}>
                    <div className="settings">
                        <h5>Binance</h5>
                        <Form.Group as={Row} controlId="formBinanceApiKey">
                            <Form.Label column>API Key</Form.Label>
                            <Col sm={10}>
                                <Form.Control
                                    placeholder="key"
                                    value={this.state.binanceApiKey}
                                    onChange={this.handleBinanceApiKeyUpdate}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="formBinanceApiSecret">
                            <Form.Label column>API Secret</Form.Label>
                            <Col sm={10}>
                                <Form.Control
                                    placeholder="secret"
                                    value={this.state.binanceApiSecret}
                                    onChange={this.handleBinanceApiSecretUpdate}
                                />
                            </Col>
                        </Form.Group>
                    </div>
                    <div className="settings">
                        <h5>Cold Storage</h5>
                        <CoinsComp
                            coins={this.state.coinsInColdStorage}
                            keyPrefix="coinsInColdStorage"
                            modalTitle="Add Coin in Cold Storage"
                            disabled={false}
                            handleUpdate={this.handleCoinsInColdStorageUpdate}
                        />
                    </div>
                    <div className="settings">
                        <h5>Initial Coins</h5>
                        <CoinsComp
                            coins={this.state.initialCoins}
                            keyPrefix="initialCoins"
                            modalTitle="Add Initial Coin"
                            disabled={false}
                            handleUpdate={this.handleInitialCoinsUpdate}
                        />
                    </div>
                    <Button variant="primary"
                        type="submit"
                        disabled={!this.state.coinsInColdStorageValid || !this.state.initialCoinsValid || !this.state.dirty}
                    >Save</Button>
                    <Button variant="secondary"
                        type="button"
                        disabled={!this.state.dirty}
                        onClick={this.handleReset}
                    >Reset</Button>
                </Form>
            </Container>
        );
    }
}