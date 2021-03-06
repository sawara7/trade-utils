export const PositionStateList = [
    "neutral",
    "opened",
    "closed"
  ] as const
export type PositionState = typeof PositionStateList[number]

export const PositionOrderList = [
    "none",
    "open",
    "close",
    "losscut"
  ] as const
export type PositionOrder = typeof PositionOrderList[number]

export interface PositionStateVariables {
    isLosscut: boolean
    positionState: PositionState
    orderState: PositionOrder
    orderStateTime: {[s: string]: number}
    canceling: boolean
    orderID: string | undefined
}

export class PositionStateClass {
    private _isLosscut: boolean = false
    private _positionState: PositionState = "neutral"
    private _orderState: PositionOrder = "none"
    private _orderStateTime: {[s: string]: number} = {}
    private _canceling: boolean = false
    private _orderID: string | undefined

    public import(value: PositionStateVariables) {
        this._isLosscut = value.isLosscut
        this._positionState = value.positionState 
        this._orderState = value.orderState
        this._orderStateTime = value.orderStateTime
        this._canceling = value.canceling 
        this._orderID = value.orderID
    }

    public export(): PositionStateVariables {
        return {
            isLosscut: this.isLosscut,
            positionState: this._positionState,
            orderState: this._orderState,
            orderStateTime: this._orderStateTime,
            canceling: this._canceling,
            orderID: this._orderID
        }
    }

    public setLosscut() {
        this._isLosscut = true
    }

    public setBeforePlaceOrder(od: PositionOrder) {
        if (this.enabledOpen && od === "open") {
            this.orderState = "open"
        } else if (this.enabledClose && od === "close") {
            this.orderState = "close"
        } else if (this.enabledClose && od === "losscut" && this.isLosscut) {
            this.orderState = "losscut"
        } else {
            throw new Error("place order error.")
        }
    }

    public setAfterPlaceOrder(id: string) {
        if (this._orderID) {
            throw new Error("set after place order error.")
        }
        this._orderID = id
    }

    public setCancelOrder() {
        if (this.isNoOrder) {
            throw new Error("cancel order error.")
        }
        this._canceling = true
    }

    public setOrderClosed() {
        if (this.isNoOrder) {
            throw new Error("order closed error.")
        }
        if (this._orderState === "open") {
            this._positionState = "opened"
        } else if (this._orderState === "close") {
            this._positionState = "closed"
        } else if (this._orderState === "losscut") {
            this._positionState = "closed"
            this._isLosscut = false
        }
        this.orderState = "none"
        this._orderID = undefined
    }

    public setOrderCanceled() {
        if (this.isNoOrder || !this._canceling) {
            // console.log("order canceled error")
            // throw new Error("order canceled error.")
        }
        this._canceling = false
        this.orderState = "none"
        this._orderID = undefined
    }

    public setOrderFailed() {
        this.orderState = "none"
        this._orderID = undefined
    }

    public setOrderCancelFailed() {
        this._canceling = false
    }

    get isLosscut(): boolean {
        return this._isLosscut
    }

    get positionState(): PositionState {
        return this._positionState
    } 

    get orderState(): PositionOrder {
        return this._orderState
    }

    private set orderState(s: PositionOrder) {
        if (this._orderState !== s) {
            this._orderState = s
            this._orderStateTime[s] = Date.now()
        }
    }

    public getOrderStateTime(s: PositionOrder): number | undefined {
        return this._orderStateTime[s]
    }

    get orderCanceling(): boolean {
        return this._canceling
    }

    get orderID(): string | undefined{
        return this._orderID
    }

    get isNoOrder(): boolean {
        return !this.orderID && this.orderState === "none"
    }

    get enabledOpen(): boolean {
        const c: PositionState[] = ["neutral", "closed"]
        return c.includes(this.positionState) && this.isNoOrder && !this._canceling
    }

    get enabledClose(): boolean {
        const c: PositionState[] = ["opened"]
        return c.includes(this.positionState) && this.isNoOrder && !this._canceling
    }

    get enabledLosscut(): boolean {
        const c: PositionState[] = ["opened"]
        return c.includes(this.positionState) && !this.isLosscut && !this._canceling
    }

    get enabledOpenOrderCancel(): boolean {
        const c: PositionState[] = ["neutral", "closed"]
        return c.includes(this.positionState) &&
         this.orderState !== "none" &&
         !!this.orderID &&
         !this.orderCanceling
    }
    
    get enabledCloseOrderCancel(): boolean {
        const c: PositionState[] = ["opened"]
        return c.includes(this.positionState) && 
         this.orderState !== "none" &&
         !!this.orderID &&
         !this.orderCanceling
    }

    public reset() {
        this._positionState = "neutral"
        this._isLosscut = false
        this._orderState = "none"
        this._orderStateTime = {}
        this._canceling = false
        this._orderID = undefined
    }
}