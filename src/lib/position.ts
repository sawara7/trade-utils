import { BaseOrderClass, OrderSide } from ".."
import { PositionStateClass } from "./positionState"

export interface Ticker {
    time: string
    bid: number
    ask: number
}

export interface Order {
    orderID: string
    clientId?: string
    market: string
    type: string
    side: string
    size: number
    price: number
    status: "closed" | string
    filledSize: number
    remainingSize: number
    avgFillPrice: number
}

export interface BasePositionParameters {
    backtestMode?: boolean
    getOpenOrder: (pos: BasePositionClass) => BaseOrderClass
    getCloseOrder: (pos: BasePositionClass) => BaseOrderClass
    getLossCutOrder?: (pos: BasePositionClass) => BaseOrderClass
    checkOpen: (pos: BasePositionClass) => boolean
    checkClose: (pos: BasePositionClass) => boolean
    checkLosscut?: (pos: BasePositionClass) => boolean
    checkOpenCancel?: (pos: BasePositionClass) => boolean
    checkCloseCancel?: (pos: BasePositionClass) => boolean
    checkLosscutCancel?: (pos: BasePositionClass) => boolean
}

export interface BasePositionResponse {
    success: boolean,
    message?: string
}

export abstract class BasePositionClass {
    private _orderLock: boolean = false

    protected _backtestMode: boolean = false

    protected _closeCount: number = 0
    protected _cumulativeFee: number = 0
    protected _cumulativeProfit: number = 0
    protected _losscutCount: number = 0

    // Position
    private _initialSize: number = 0
    private _currentSize: number = 0

    private _openPrice: number = 0
    private _closePrice: number = 0

    // Order
    private _openOrder?: BaseOrderClass
    private _closeOrder?: BaseOrderClass
    private _losscutOrder?: BaseOrderClass

    protected _positionState: PositionStateClass

    private _bestBid: number = 0
    private _previousBid: number = 0
    private _bestAsk: number = 0
    private _previousAsk: number = 0
    private _ema100Bid: number = 0
    private _ema100Ask: number = 0
    private _ema1000Bid: number = 0
    private _ema1000Ask: number = 0
    private _minBid: number = 0
    private _minAsk: number = 0
    private _maxBid: number = 0
    private _maxAsk: number = 0

    // Events
    public onOpened?: (pos: BasePositionClass) => void
    public onClosed?: (pos: BasePositionClass) => void
    public onDoneLosscut?: (pos: BasePositionClass) => void

    public onOpenOrderCanceled?: (pos: BasePositionClass) => void
    public onCloseOrderCanceled?: (pos: BasePositionClass) => void
    public onLosscutOrderCanceled?: (pos: BasePositionClass) => void

    // Conditions
    private _checkOpen: (pos: BasePositionClass) => boolean
    private _checkClose: (pos: BasePositionClass) => boolean
    private _checkLosscut?: (pos: BasePositionClass) => boolean

    private _checkOpenCancel?: (pos: BasePositionClass) => boolean
    private _checkCloseCancel?: (pos: BasePositionClass) => boolean
    private _checkLosscutCancel?: (pos: BasePositionClass) => boolean

    // getOrder
    private _getOpenOrder: (pos: BasePositionClass) => BaseOrderClass
    private _getCloseOrder: (pos: BasePositionClass) => BaseOrderClass
    private _getLosscutOrder?: (pos: BasePositionClass) => BaseOrderClass

    constructor(params: BasePositionParameters){
        this._positionState = new PositionStateClass()
        this._backtestMode = params.backtestMode? params.backtestMode: false

        this._getOpenOrder = params.getOpenOrder
        this._getCloseOrder = params.getCloseOrder
        this._getLosscutOrder = params.getLossCutOrder
        
        this._checkOpen = params.checkOpen
        this._checkClose = params.checkClose
        this._checkLosscut = params.checkLosscut
        
        this._checkCloseCancel = params.checkCloseCancel
        this._checkOpenCancel = params.checkOpenCancel
        this._checkLosscutCancel = params.checkLosscutCancel
    }

    public async open(): Promise<void> {
        const res = await this.lock(async()=>{
            this.state.setBeforePlaceOrder("open")
            const id = await this.doOpen()
            this.state.setAfterPlaceOrder(id)
        })
        if (!res.success) {
            console.log("[open error]" + res.message)
            this.state.setOrderFailed()
        }
    }

    abstract doOpen(): Promise<string>

    public async close(): Promise<void> {
        const res = await this.lock(async()=>{
            this.state.setBeforePlaceOrder(this.state.isLosscut? "losscut": "close")
            const id = await this.doClose()
            this.state.setAfterPlaceOrder(id)
        })
        if (!res.success) {
            console.log("[closer error]" + res.message)
            this.state.setOrderFailed()
        }
    }

    abstract doClose(): Promise<string>

    public async cancel(): Promise<void> {
        const res = await this.lock(async()=>{
            this._positionState.setCancelOrder()
            await this.doCancel()
        })
        if (!res.success) {
            console.log("[cancel error]" + res.message)
            this.state.setOrderCancelFailed()
        }
    }

    abstract doCancel(): Promise<void>

    public async losscut(): Promise<void> {
        if (this._positionState.enabledLosscut) {
            if (!this.state.isNoOrder && !this.state.orderCanceling) {
                this._positionState.setLosscut()
                await this.cancel()
            }
        }
    }

    public updateTicker(ticker: Ticker) {
        this.bestAsk = ticker.ask
        this.bestBid = ticker.bid
        if ((this.state.enabledOpenOrderCancel && this._checkOpenCancel && this._checkOpenCancel(this)) ||
            (this.state.enabledCloseOrderCancel && this._checkCloseCancel && this._checkCloseCancel(this) ||
            (this.state.enabledCloseOrderCancel && this._checkLosscutCancel && this._checkLosscutCancel(this)))
        ){
            console.log(this.currentOpenPrice, this.state.positionState, 'cancel')
            this.cancel()
        } else if (this.state.enabledOpen && this._checkOpen(this)) {
            console.log(this.currentOpenPrice, 'open')
            this._openOrder = this._getOpenOrder(this)
            this.open()
        } else if (this.state.enabledClose && this._checkClose(this)) {
            console.log(this.currentOpenPrice, 'close')
            this._closeOrder = this._getCloseOrder(this)
            this.close()
        } else if (this.state.enabledLosscut && this._checkLosscut && this._getLosscutOrder && this._checkLosscut(this)) {
            console.log(this.currentOpenPrice, 'losscut')
            this._losscutOrder = this._getLosscutOrder(this)
            this.losscut()
        }
    }

    private updateOpenOrder(order: Order) {
        if (!this._openOrder) { return }
        const size = this._openOrder.roundSize(order.size)
        const filled = this._openOrder.roundSize(order.filledSize)
        if (filled > 0) {
            this._currentSize = filled
            this._initialSize = filled
            this._openPrice = this._openOrder.roundPrice(order.avgFillPrice? order.avgFillPrice: order.price)
        }
        if (filled !== size) {
            this.state.setOrderCanceled()
            if (this.onOpenOrderCanceled) {
                this.onOpenOrderCanceled(this)
            }
            return
        }
        if (filled === size) {
            this.state.setOrderClosed()
            if (this.onOpened){
                this.onOpened(this)
            }
            return
        }
    }

    private updateCloseOrder(order: Order) {
        if (!this._closeOrder || !this._openOrder) { return }
        const size = this._closeOrder.roundSize(order.size)
        const filled = this._closeOrder.roundSize(order.filledSize)
        if (filled > 0) {
            if (["close", "losscut"].includes(this.state.orderState)) {
                this._currentSize = this._closeOrder.roundSize(this._currentSize - filled)
                this._closePrice = this._closeOrder.roundPrice(order.avgFillPrice? order.avgFillPrice: order.price)
            }
        }
        if (filled !== size) {
            this.state.setOrderCanceled()
            if (this.onCloseOrderCanceled){
                this.onCloseOrderCanceled(this)
            }
            return
        }
        if (filled === size) {this.setClose()}
    }

    private updateLosscutOrder(order: Order) {
        if (!this._losscutOrder || !this._openOrder) { return }
        const size = this._losscutOrder.roundSize(order.size)
        const filled = this._losscutOrder.roundSize(order.filledSize)
        if (filled > 0) {
            this._currentSize = this._losscutOrder.roundSize(this._currentSize - filled)
            this._closePrice = this._losscutOrder.roundPrice(order.avgFillPrice? order.avgFillPrice: order.price)
        }
        if (filled !== size) {
            this.state.setOrderCanceled()
            if (this.onLosscutOrderCanceled){
                this.onLosscutOrderCanceled(this)
            }
            return
        }
        if (filled === size) {
            if (this.state.isLosscut) {
                this._losscutCount++
                if (this.onDoneLosscut){
                    this.onDoneLosscut(this)
                }
            }
            this.setClose()
        }
    }

    private setClose() {
        if (!this._openOrder) { return }
        this._cumulativeProfit += this._initialSize * 
        (this._openOrder.side === 'buy' ? (this._closePrice - this._openPrice): (this._openPrice - this._closePrice))
        this._initialSize = 0
        this._currentSize = 0
        this._closeCount++
        this.state.setOrderClosed()
        if (this.onClosed){
            this.onClosed(this)
        }
    }

    public updateOrder(order: Order) {
        if (order.status !== 'closed') { return }
        if (order.orderID !== this.state.orderID) { return }
        if (this.state.orderState === "open") {
            this.updateOpenOrder(order)
        } else if (this.state.orderState === "close") {
            this.updateCloseOrder(order)
        } else if (this.state.orderState === "losscut") {
            this.updateLosscutOrder(order)
        }
    }

    get profit(): number {
        return this._cumulativeProfit - this._cumulativeFee
    }

    get unrealizedProfit(): number {
        let result = 0
        if (this._openOrder && this._currentSize > 0) {
            if (this._openOrder.side === 'buy') {
                result = (this.bestBid - this._openPrice) * this._currentSize
            } else {
                result = (this._openPrice - this.bestAsk) * this._currentSize
            }
        }
        return result
    }

    get closeCount(): number {
        return this._closeCount
    }

    get losscutCount(): number {
        return this._losscutCount
    }
    
    get bestBid(): number {
        return this._bestBid
    }

    get previousBid(): number {
        return this._previousBid
    }

    get emaBid100(): number {
        return this._ema100Bid
    }

    get emaBid1000(): number {
        return this._ema1000Bid
    }

    get maxBid(): number {
        return this._maxBid
    }

    get minBid(): number {
        return this._minBid
    }

    set bestBid(value: number) {
        this._previousBid = this._bestBid
        this._bestBid = value
        this._ema100Bid = this._ema100Bid * (1-1/100) + value * 1/100
        this._ema1000Bid = this._ema1000Bid * (1-1/1000) + value * 1/1000

        if (this._positionState.positionState === "opened") {
            this._minBid = this._minBid > value ? value: this._minBid
            this._maxBid = this._maxBid < value ? value: this._maxBid    
        } else {
            this._minBid = value
            this._maxBid = value
        }
    }

    get bestAsk(): number {
        return this._bestAsk
    }

    get previousAsk(): number {
        return this._previousAsk
    }

    get emaAsk100(): number {
        return this._ema100Ask
    }

    get emaAsk1000(): number {
        return this._ema1000Ask
    }

    get maxAsk(): number {
        return this._maxAsk
    }

    get minAsk(): number {
        return this._minAsk
    }

    set bestAsk(value: number) {
        this._previousAsk = this._bestAsk
        this._bestAsk = value
        this._ema100Ask = this._ema100Ask * (1-1/100) + value * 1/100
        this._ema1000Ask = this._ema1000Ask * (1-1/1000) + value * 1/1000

        if (this._positionState.positionState === "opened") {
            this._minAsk = this._minAsk > value ? value: this._minAsk
            this._maxAsk = this._maxAsk < value ? value: this._maxAsk    
        } else {
            this._minAsk = value
            this._maxAsk = value
        }
    }

    get state(): PositionStateClass {
        return this._positionState
    }

    get currentOpenPrice(): number {
        return this._openPrice
    }

    get currentClosePrice(): number {
        return this._closePrice
    }

    get currentSize(): number {
        return this._currentSize
    }

    get openOrder(): BaseOrderClass | undefined {
        return this._openOrder
    }

    get closeOrder(): BaseOrderClass | undefined {
        return this._closeOrder
    }

    private async lock(cb: ()=>Promise<void>): Promise<BasePositionResponse> {
        const res: BasePositionResponse = {
            success: true    
        }
        if (this._orderLock) {
            return {
                success: false,
                message: 'Order Locked'
            }
        }
        try {
            this._orderLock = true
            await cb()
        } catch(e) {
            res.success = false
            if (e instanceof Error) {
                res.message = e.message
            }
        } finally {
            this._orderLock = false
        }
        return res
    }
}