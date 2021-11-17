export class Allocation {
    constructor(
        readonly symbol: string,
        readonly pct: number,
        readonly valueUsd: number,
        readonly valueBtc: number,
    ) { }
}

export interface Allocator {
    allocations: { [key: string]: Allocation; };
}