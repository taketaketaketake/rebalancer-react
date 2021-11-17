import * as React from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { IndexType, Settings } from "../common/settings";
import { Coin, CoinsComp, CoinsUtils } from "./coins";

interface IndexProps {
    settings: Settings,
    handleSettingsUpdate: (settings: Partial<Settings>) => Promise<void>,
}

interface IndexState {
    indexType: IndexType,
    marketCapNbCoins: string,
    marketCapSquared: boolean,
    customCoins: Coin[],
    dirty: boolean,
    marketCapNbCoinsValid: boolean,
    customCoinsValid: boolean,
}

export class IndexComp extends React.Component<IndexProps, IndexState> {

    constructor(props: IndexProps) {
        super(props);
        this.state = this.initialState();

        this.handleIndexTypeUpdate = this.handleIndexTypeUpdate.bind(this);
        this.handleMarketCapNbCoinsUpdate = this.handleMarketCapNbCoinsUpdate.bind(this);
        this.handleMarketCapSquaredUpdate = this.handleMarketCapSquaredUpdate.bind(this);
        this.handleCustomCoinsUpdate = this.handleCustomCoinsUpdate.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleReset = this.handleReset.bind(this);
    }

    initialState() {
        return {
            indexType: this.props.settings.targetIndexType,
            marketCapNbCoins: this.props.settings.targetIndexMarketCapNumberCoins.toString(),
            marketCapSquared: this.props.settings.targetIndexMarketCapSquared,
            customCoins: this.props.settings.targetIndexCustomCoins.map(coin => (
                { symbol: coin.symbol, total: coin.total.toString() })),
            dirty: false,
            marketCapNbCoinsValid: true,
            customCoinsValid: true,
        }
    }

    handleIndexTypeUpdate(e: React.ChangeEvent<HTMLInputElement>) {
        const indexType = e.target.value as IndexType;
        const newState = { indexType };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    // TODO find proper type to use for this event
    handleMarketCapNbCoinsUpdate(e: any) {
        const marketCapNbCoins = e.target.value;
        const nb = Number(marketCapNbCoins); // 0 for an empty string
        const marketCapNbCoinsValid = nb >= 1 && nb <= 30;
        const newState = { marketCapNbCoins, marketCapNbCoinsValid };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    handleMarketCapSquaredUpdate(e: React.ChangeEvent<HTMLInputElement>) {
        const newState = { marketCapSquared: e.target.checked };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    handleCustomCoinsUpdate(coins: Coin[]) {
        // Valid if we have no coin with an empty total
        const customCoinsValid = !coins.find(coin =>
            !coin.total || coin.total.trim().length == 0);
        const newState = { customCoins: coins, customCoinsValid };
        const dirty = this.isChanged(newState);
        this.setState({ ...newState, dirty });
    }

    getChangedSettings(state: Partial<IndexState>) {
        const changed: Partial<Settings> = {};
        if (state.indexType && this.props.settings.targetIndexType != state.indexType) {
            changed.targetIndexType = state.indexType;
        }
        if (state.marketCapNbCoins != undefined && this.props.settings.targetIndexMarketCapNumberCoins != Number(state.marketCapNbCoins)) {
            changed.targetIndexMarketCapNumberCoins = Number(state.marketCapNbCoins);
        }
        if (state.marketCapSquared != undefined && this.props.settings.targetIndexMarketCapSquared != state.marketCapSquared) {
            changed.targetIndexMarketCapSquared = state.marketCapSquared;
        }
        if (state.customCoins && !CoinsUtils.isCoinsEqual(
            this.props.settings.targetIndexCustomCoins, state.customCoins)) {
            changed.targetIndexCustomCoins = CoinsUtils.mapCoins(state.customCoins);
        }
        return changed;
    }

    isChanged(state: Partial<IndexState>) {
        const changed = this.getChangedSettings(state);
        return Object.keys(changed).length != 0;
    }

    async handleSave(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!this.state.marketCapNbCoinsValid ||
            !this.state.customCoinsValid ||
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
                <h1>Index</h1>
                <Form noValidate onSubmit={this.handleSave}>
                    <div className="settings">
                        <Form.Check
                            name="indextype"
                            type="radio"
                            label="Market Cap"
                            checked={this.state.indexType === 'marketCap'}
                            value="marketCap"
                            onChange={this.handleIndexTypeUpdate}
                        />
                        <Form.Group as={Row} controlId="formIndexMarketCap" className="indexSection">
                            <Col sm={3}>
                                <Form.Label column>Number of Coins</Form.Label>
                            </Col>
                            <Col sm={7}>
                                <Form.Control
                                    disabled={this.state.indexType != 'marketCap'}
                                    value={this.state.marketCapNbCoins}
                                    type="number"
                                    placeholder="number"
                                    onChange={this.handleMarketCapNbCoinsUpdate}
                                />
                                <div className="invalid" hidden={this.state.indexType != 'marketCap' || this.state.marketCapNbCoinsValid}>
                                    Please provide a number of coins between 1 and 30.
                                </div>
                            </Col>
                            <Col sm={2}>
                                <Form.Check
                                    disabled={this.state.indexType != 'marketCap'}
                                    checked={this.state.marketCapSquared}
                                    label="Squared"
                                    type={'checkbox'}
                                    onChange={this.handleMarketCapSquaredUpdate}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Check
                            name="indextype"
                            type="radio"
                            label="Custom"
                            checked={this.state.indexType === 'custom'}
                            value="custom"
                            onChange={this.handleIndexTypeUpdate}
                        />
                        <Form.Group className="indexSection">
                            <CoinsComp
                                coins={this.state.customCoins}
                                keyPrefix="indexCustomCoins"
                                modalTitle="Add Coin"
                                disabled={this.state.indexType !== 'custom'}
                                handleUpdate={this.handleCustomCoinsUpdate}
                            />
                        </Form.Group>
                        <Button variant="primary"
                            type="submit"
                            disabled={!this.state.marketCapNbCoinsValid || !this.state.customCoinsValid || !this.state.dirty}
                        >Save</Button>
                        <Button variant="secondary"
                            type="button"
                            disabled={!this.state.dirty}
                            onClick={this.handleReset}
                        >Reset</Button>
                    </div>
                </Form>
            </Container>
        );
    }

}