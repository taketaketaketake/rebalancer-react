import * as React from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { COINSMAP } from "../common/coinsmap";
import { StoredCoin } from "../common/settings";

export type Coin = {
    symbol: string,
    total: string,
}

type CoinsCompProps = {
    coins: Coin[],
    keyPrefix: string,
    modalTitle: string,
    handleUpdate: (coins: Coin[]) => void,
    disabled: boolean,
}

type CoinsCompState = {
    show: boolean,
    validated: boolean,
    current: Coin,
}

export class CoinsUtils {

    static mapStoredCoins(coins: StoredCoin[]) {
        return coins.map(
            coin => ({ symbol: coin.symbol, total: coin.total.toString() }));
    }

    static mapCoins(coins: Coin[]) {
        return coins.map(
            coin => ({ symbol: coin.symbol, total: Number(coin.total) }));
    }

    static isCoinsEqual(storedCoins: StoredCoin[], coins: Coin[]) {
        if (storedCoins.length != coins.length) {
            return false;
        }
        for (let i = 0; i < storedCoins.length; i++) {
            const storedCoin = storedCoins[i];
            const coin = coins[i];
            if (storedCoin.symbol != coin.symbol) {
                return false;
            }
            if (storedCoin.total.toString() != coin.total) {
                return false;
            }
        }
        return true;
    }
}

export class CoinsComp extends React.Component<CoinsCompProps, CoinsCompState> {

    constructor(props: CoinsCompProps) {
        super(props);
        this.state = {
            show: false,
            validated: false,
            current: { symbol: "", total: "" },
        };
        this.handleShow = this.handleShow.bind(this);
        this.handleHide = this.handleHide.bind(this);
        this.handleAdd = this.handleAdd.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    getSymbols() {
        return Object.keys(COINSMAP).filter(
            symbol => !this.props.coins.find(coin => coin.symbol === symbol));
    }

    handleShow() {
        const symbols = this.getSymbols();
        this.setState({
            show: true,
            validated: false,
            current: { symbol: symbols.length > 0 ? symbols[0] : "", total: "" },
        });
    }

    handleHide() {
        this.setState({ show: false });
    }

    handleAdd() {
        const { symbol, total } = this.state.current;
        if (total && symbol) {
            const coins = this.props.coins.concat({ symbol, total });
            this.props.handleUpdate(coins);
            this.handleHide();
        } else {
            // Activate validation mode to show the error
            this.setState({ validated: true });
        }
    }

    handleUpdate(symbol: string, total: string) {
        const coins = this.props.coins.map(coin => {
            if (coin.symbol === symbol) {
                return { symbol, total };
            }
            return coin;
        });
        this.props.handleUpdate(coins);
    }

    handleDelete(symbol: string) {
        const coins = this.props.coins.filter(
            coin => coin.symbol !== symbol);
        this.props.handleUpdate(coins);
    }

    handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        e.stopPropagation();
        this.handleAdd();
    }

    isCoinValid(coin: Coin) {
        return !!coin && !!coin.total && coin.total.trim().length > 0;
    }

    render() {
        return (
            <>
                {this.props.coins.map(coin => (
                    <Form.Group key={coin.symbol} as={Row} controlId={this.props.keyPrefix + '_' + coin.symbol}>
                        <Col sm={2}>
                            <Form.Label column>{coin.symbol}</Form.Label>
                        </Col>
                        <Col sm={9}>
                            <Form.Control
                                type="number"
                                placeholder="number"
                                value={coin.total}
                                disabled={this.props.disabled}
                                onChange={(e: any) => this.handleUpdate(coin.symbol, e.target.value)}
                            />
                            <div className="invalid" hidden={this.isCoinValid(coin)}>
                                Please provide a number of coins.
                            </div>
                        </Col>
                        <Button variant="danger"
                            disabled={this.props.disabled}
                            onClick={() => this.handleDelete(coin.symbol)}>Delete</Button>
                    </Form.Group>
                ))}
                <Button onClick={this.handleShow}
                    disabled={this.props.disabled}>Add coin</Button>
                <Modal show={this.state.show} onHide={this.handleHide} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>{this.props.modalTitle}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form validated={this.state.validated} onSubmit={this.handleSubmit}>
                            <Form.Group as={Row} controlId={this.props.keyPrefix + '_' + "formAdd"}>
                                <Col sm={4}>
                                    <Form.Control as="select" required
                                        onChange={(e: any) => {
                                            const symbol = e.target.value;
                                            this.setState(state => ({ current: { ...state.current, symbol } }))
                                        }}
                                    >
                                        {this.getSymbols().map(
                                            symbol => <option key={symbol} value={symbol}>{symbol} ({COINSMAP[symbol]})</option>)}
                                    </Form.Control>
                                </Col>
                                <Col sm={8}>
                                    <Form.Control placeholder="number" type="number" required
                                        onChange={(e: any) => {
                                            const total = e.target.value;
                                            this.setState(state => ({ current: { ...state.current, total } }));
                                        }}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        Please provide number of coins.
                                    </Form.Control.Feedback>
                                </Col>
                            </Form.Group>
                            <div className="modal-add-coin-buttons text-right">
                                <Button variant="primary" onClick={this.handleAdd}>Add</Button>
                                <Button variant="secondary" onClick={this.handleHide}>Cancel</Button>
                            </div>
                        </Form>
                    </Modal.Body>
                </Modal>
            </>
        );
    }
}