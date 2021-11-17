import * as React from "react";
import { Button, Col, Container, Form, Modal, Row, Table } from "react-bootstrap";
import { BinanceClient } from "../common/binanceclient";
import { Entry, Portfolio } from "../common/portfolio";
import { Trade } from "../common/tradebuilder";

interface PortfolioProps {
    portfolio: Portfolio,
    trades: Trade[],
    client: BinanceClient,
    hodl: number,
    error?: Error,
}

interface PortfolioState {
    showTrades: boolean,
}

export class PortfolioComp extends React.Component<PortfolioProps, PortfolioState> {

    constructor(props: PortfolioProps) {
        super(props)
        this.state = {
            showTrades: false,
        }

        this.handleClick = this.handleClick.bind(this);
        this.handleHide = this.handleHide.bind(this);
    }

    handleClick() {
        this.setState({ showTrades: true });
    }

    handleHide() {
        this.setState({ showTrades: false });
    }

    renderHeading() {
        return <h1>Portfolio</h1>;
    }

    render() {
        // Display error
        if (this.props.error) {
            return (
                <>
                    {this.renderHeading()}
                    <div>{this.props.error.message}</div>
                </>);
        }

        // Here, the portfolio is still loading
        if (!this.props.portfolio) {
            return (
                <>
                    {this.renderHeading()}
                    <div className="loading">
                        <img src="./loading.gif" />
                    </div>
                </>);
        }

        const trades = this.props.trades;
        const missingCoinsInHotWallet = trades.some(trade => trade.missingUnits > 0);

        const usd = this.props.portfolio.totalValueUsd;
        const hodl = this.props.hodl;
        const alpha = (usd / hodl - 1) * 100

        return (
            <>
                <Container fluid={true}>
                    {this.renderHeading()}
                    <Row>
                        <Col>
                            <div>USD: {usd.toFixed(2)}$</div>
                        </Col>
                        <Col>
                            <Button
                                disabled={trades.length === 0 || missingCoinsInHotWallet}
                                onClick={this.handleClick}>View Trades</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col><div>HODL: {hodl.toFixed(2)}$</div></Col>
                    </Row>
                    <Row>
                        <Col><div>Alpha: {alpha.toFixed(2)}%</div></Col>
                    </Row>
                    <Row>
                        <Col>
                            <TableComp
                                entries={this.props.portfolio.entries}
                                trades={trades} />
                        </Col>
                    </Row>
                </Container>
                <Modal show={this.state.showTrades} onHide={this.handleHide} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Trades</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <TableTradesComp
                            trades={this.props.trades} client={this.props.client} />
                    </Modal.Body>
                </Modal>
            </>
        );
    }
}

interface TableProps {
    entries: Entry[],
    trades: Trade[];
}

const TableComp: React.FunctionComponent<TableProps> = (props: TableProps) => {
    return (
        <Table striped bordered hover size="sm">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Coin</th>
                    <th>Amount</th>
                    <th>Value ($)</th>
                    <th>Target ($)</th>
                    <th>Current (%)</th>
                    <th>Target (%)</th>
                    <th>Drift (%)</th>
                    <th>Trade</th>
                    <th>Missing</th>
                </tr>
            </thead>
            <tbody>
                {props.entries.map((entry, index) => {
                    const drift = entry.pct - entry.targetPct;
                    const trade = props.trades.find(trade => trade.symbol === entry.symbol);
                    return (
                        <tr key={entry.symbol}>
                            <td>{index + 1}</td>
                            <td>{entry.symbol}</td>
                            <td>{entry.amount}</td>
                            <td>{entry.valueUsd.toFixed(2)}</td>
                            <td>{entry.targetValueUsd.toFixed(2)}</td>
                            <td>{(entry.pct * 100).toFixed(2)}</td>
                            <td>{(entry.targetPct * 100).toFixed(2)}</td>
                            <td>{(drift * 100).toFixed(2)}</td>
                            <td>{!trade ? "" : trade.units}</td>
                            <td className='missing'>{!trade || trade.missingUnits == 0 ? "" : trade.missingUnits}</td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}

interface TableTradesProps {
    trades: Trade[],
    client: BinanceClient,
}

interface TableTradesState {
    executed: boolean,
    fullView: boolean,
    current: string,
    status: { [symbol: string]: string },
    results: { [symbol: string]: any },
}

class TableTradesComp extends React.Component<TableTradesProps, TableTradesState> {

    constructor(props: TableTradesProps) {
        super(props);
        this.state = {
            executed: false,
            fullView: true,
            current: '',
            status: {},
            results: {},
        };
        this.handleSubmit = this.handleSubmit.bind(this);
        this.showFullView = this.showFullView.bind(this);
    }

    handleSubmit(e: any) {
        e.preventDefault();
        e.stopPropagation();
        this.props.trades.forEach(async trade => {
            try {
                const response = await this.props.client.trade(trade);
                this.updateStatus(trade.symbol, "OK", response);
            } catch (e) {
                this.updateStatus(trade.symbol, "FAIL", e.message);
            }
        });
        this.setState({ executed: true });
    }

    updateStatus(symbol: string, status: string, result: any) {
        this.setState(state => ({
            ...state,
            status: {
                ...state.status,
                [symbol]: status,
            },
            results: {
                ...state.results,
                [symbol]: result,
            }
        }));
    }

    showResults(trade: Trade) {
        if (this.state.executed && this.state.results[trade.symbol]) {
            this.setState({ current: trade.symbol, fullView: false });
        }
    }

    showFullView(e: any) {
        e.preventDefault();
        e.stopPropagation();
        this.setState({ current: '', fullView: true });
    }

    renderFullView() {
        return <Form onSubmit={this.handleSubmit}>
            <Table striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Units</th>
                        <th>Side</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.trades.map(trade => (
                        <tr key={trade.symbol} onClick={() => this.showResults(trade)}>
                            <td>{trade.symbol}</td>
                            <td>{Math.abs(trade.units)}</td>
                            <td>{trade.units < 0 ? "BUY" : "SELL"}</td>
                            <td>{this.state.status[trade.symbol]}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Button variant="danger" type="submit" disabled={this.state.executed}>Execute</Button>
        </Form>;
    }

    renderResults() {
        return <Form onSubmit={this.showFullView}>
            <pre>{JSON.stringify(this.state.results[this.state.current], null, 2)}</pre>
            <Button type="submit">Back</Button>
        </Form>
    }

    render() {
        return this.state.fullView ? this.renderFullView() : this.renderResults();
    }
}