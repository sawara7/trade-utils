import { SequenceList, SequenceListType, UUIDInstanceClass } from "my-utils"
import { Ticker } from "./position"

export class TickerClass extends UUIDInstanceClass {
    private _sequenceList: SequenceList

    constructor(intervalSec: number, sequenceNum: number) {
        super()
        this._sequenceList = new SequenceList(intervalSec, sequenceNum)
    }

    public update(ticker: Ticker) {
        const tk: SequenceListType = {
            ask: ticker.ask,
            bid: ticker.bid,
            timestamp: Date.now()
        }
        this._sequenceList.push(tk)
    }

    get bestBid(): number | null {
        return this._sequenceList.lastValue("bid")
    }

    get bestAsk(): number | null {
        return this._sequenceList.lastValue("ask")
    }
}