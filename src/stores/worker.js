import { validPos, directions, gridType } from '../store'

export class Worker {
    constructor(pos, targetCustomer = 0, targetIceType = 0) {
        this.x = pos[0]
        this.y = pos[1]
        this.destination = []
        this.wishDirection = -1
        this.targetCustomer = targetCustomer 
        this.targetIceType = targetIceType
        this.hasContainer = false
        this.hasProduct = false
        this.hasIce = false
    }

    static dupWorker(worker) {
        const newWorker = new Worker([worker.x, worker.y], worker.targetCustomer, worker.targetIceType)
        newWorker.destination = worker.destination
        newWorker.wishDirection = worker.withDirection
        newWorker.hasContainer = worker.hasContainer
        newWorker.hasProduct = worker.hasProduct
        newWorker.hasIce = worker.hasIce
        return newWorker
    }

    updateState() {
        this.destination = []
        let broughtProduct = false
        if (!this.hasContainer) this.hasContainer = true
        else if (!this.hasProduct) {
            this.hasProduct = true
            broughtProduct = true
        }
        else if (!this.hasIce) this.hasIce = true
        else {
            this.hasContainer = false
            this.hasProduct = false
            this.hasIce = false
            this.targetCustomer = 0
        }
        return broughtProduct
    }

    setDestination(layoutGrid) {
        let destinationGridType, targetCustomer = 0
        if (!this.hasContainer) {
            if (this.targetIceType === 0) destinationGridType = 'holedContainerPlace'
            else destinationGridType = 'imperforateContainerPlace'
        } else if (!this.hasProduct) {
            destinationGridType = 'table'
            targetCustomer = this.targetCustomer
        } else if (!this.hasIce) {
            if (this.targetIceType === 0) destinationGridType = 'bareIce'
            else destinationGridType = 'baggedIce'
        } else {
            destinationGridType = 'packingPlace'
        }
        const pos = [this.x, this.y]
        const destination = this.nearestDestination(layoutGrid, pos, destinationGridType, targetCustomer)
        this.wishDirection = destination[2]
        this.destination = [destination[0], destination[1]]
        return destination
    }

    // 目的地とその方向を、幅優先探索で見つける。配列の3番目の要素は、目的地へ最短距離のルートの方向を表す
    nearestDestination = (layoutGrid, pos, gridTypeStr, targetCustomer = 0) => {
        const queue = []
        const visitedPos = new Set()
        const init = [...pos, -1]
        queue.push(init)
        visitedPos.add(pos)
        while(queue.length > 0) {
            const curState = queue.shift()
            const curPos = [curState[0], curState[1]]
            let initDirection = curState[2]
            for (let i = 0; i < 4; i++) {
                const direction = directions[i]
                if (curState[2] < 0) initDirection = i
                const nextState = [curPos[0] + direction[0], curPos[1] + direction[1], initDirection]
                const nextPos = [nextState[0], nextState[1]]
                // nextPosをそのままSetに加えても、一意なsetにならないので、数字で管理する
                if (visitedPos.has(nextPos[0] * 100 + nextPos[1])) continue
                visitedPos.add(nextPos[0] * 100 + nextPos[1])
                if (!validPos(nextPos)) continue
                
                const nextGrid = layoutGrid[nextPos[0]][nextPos[1]]
                const nextGridType = nextGrid.type
                if (nextGridType === gridType[gridTypeStr]) {
                    if (gridTypeStr === 'table') {
                        if (nextGrid.value === targetCustomer) {
                            return nextState
                        } else {
                            continue
                        }
                    }
                    else return nextState
                } else if (nextGridType === gridType['available']) {
                    queue.push(nextState)
                }
            }
        }
        return [0, 0, -1]
    }
}