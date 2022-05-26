import {PositionOrderList, PositionStateClass, PositionStateList} from './positionState'

test('Test PositionState', () => {
    expect(PositionStateList.includes('opened')).toBeTruthy()
    expect(PositionStateList.includes('closed')).toBeTruthy()
    expect(PositionStateList.includes('neutral')).toBeTruthy()
})

test('Test PositionOrder', () => {
    expect(PositionOrderList.includes('open')).toBeTruthy()
    expect(PositionOrderList.includes('close')).toBeTruthy()
    expect(PositionOrderList.includes('losscut')).toBeTruthy()
    expect(PositionOrderList.includes('none')).toBeTruthy()
})

test('PositionStateClass initial value', () => {
    const pos = new PositionStateClass()
    expect(pos.enabledOpen).toBeTruthy()
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledCloseOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(pos.isNoOrder).toBeTruthy()
    expect(pos.positionState === "neutral").toBeTruthy()
    expect(pos.orderState === "none").toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()
})

test('PositionStateClass Open', () => {
    const pos = new PositionStateClass()
    pos.setBeforePlaceOrder("open")
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("open")
    expect(pos.positionState).toBe("neutral")
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()

    pos.setAfterPlaceOrder("id1")
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("open")
    expect(pos.positionState).toBe("neutral")
    expect(!pos.enabledClose).toBeTruthy()
    expect(pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(pos.orderID).toBe("id1")
    expect(!pos.orderCanceling).toBeTruthy()

    pos.setOrderClosed()
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("none")
    expect(pos.positionState).toBe("opened")
    expect(pos.enabledClose).toBeTruthy()
    expect(!pos.enabledCloseOrderCancel).toBeTruthy()
    expect(pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()
})

test('PositionStateClass Open Order Cancel', () => {
    const pos = new PositionStateClass()
    pos.setBeforePlaceOrder("open")
    pos.setAfterPlaceOrder("id1")
    pos.setCancelOrder()
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("open")
    expect(pos.positionState).toBe("neutral")
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(pos.orderID).toBe("id1")
    expect(pos.orderCanceling).toBeTruthy()

    pos.setOrderCanceled()
    expect(pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("none")
    expect(pos.positionState).toBe("neutral")
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()
})

test('PositionStateClass Close', () => {
    const pos = new PositionStateClass()
    pos.setBeforePlaceOrder("open")
    pos.setAfterPlaceOrder("id1")
    pos.setOrderClosed()
    pos.setBeforePlaceOrder("close")
    expect(pos.orderState).toBe("close")
    expect(pos.positionState).toBe("opened")
    expect(!pos.enabledOpen).toBeTruthy()
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()

    pos.setAfterPlaceOrder("id2")
    expect(pos.orderState).toBe("close")
    expect(pos.positionState).toBe("opened")
    expect(!pos.enabledOpen).toBeTruthy()
    expect(!pos.enabledClose).toBeTruthy()
    expect(pos.enabledCloseOrderCancel).toBeTruthy()
    expect(pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(pos.orderID).toBe("id2")
    expect(!pos.orderCanceling).toBeTruthy()

    pos.setOrderClosed()
    expect(pos.orderState).toBe("none")
    expect(pos.positionState).toBe("closed")
    expect(pos.enabledOpen).toBeTruthy()
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledCloseOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()
})

test('PositionStateClass Open Order Cancel', () => {
    const pos = new PositionStateClass()
    pos.setBeforePlaceOrder("open")
    pos.setAfterPlaceOrder("id1")
    pos.setOrderClosed()
    pos.setBeforePlaceOrder("close")
    pos.setAfterPlaceOrder("id2")
    pos.setCancelOrder()
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("close")
    expect(pos.positionState).toBe("opened")
    expect(!pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(!pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(!pos.isNoOrder).toBeTruthy()
    expect(pos.orderID).toBe("id2")
    expect(pos.orderCanceling).toBeTruthy()

    pos.setOrderCanceled()
    expect(!pos.enabledOpen).toBeTruthy()
    expect(pos.orderState).toBe("none")
    expect(pos.positionState).toBe("opened")
    expect(pos.enabledClose).toBeTruthy()
    expect(!pos.enabledOpenOrderCancel).toBeTruthy()
    expect(pos.enabledLosscut).toBeTruthy()
    expect(!pos.isLosscut).toBeTruthy()
    expect(pos.isNoOrder).toBeTruthy()
    expect(!pos.orderID).toBeTruthy()
    expect(!pos.orderCanceling).toBeTruthy()
})

test('PositionStateClass Losscut', () => {
    const pos = new PositionStateClass()
    pos.setBeforePlaceOrder("open")
    pos.setAfterPlaceOrder("id1")
    pos.setOrderClosed()
    pos.setLosscut()
    pos.setBeforePlaceOrder("losscut")
    expect(pos.orderState).toBe("losscut")
    pos.setAfterPlaceOrder("id2")
    pos.setOrderClosed()
    expect(pos.orderState).toBe("none")
    expect(pos.positionState).toBe("closed")
})
