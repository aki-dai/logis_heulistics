import { get, writable, derived } from 'svelte/store'
import { Input } from './stores/input'
import { Output } from './stores/output'
import { Worker } from './stores/worker'

const WIDTH = 25
const LENGTH = 25
const CONTAINER_PLACE_LENGTH = 2
const PACKING_PLACE_LENGTH = 22
const WORKER_NUM = 20

export const input = Input()
export const output = Output(input)

export const gridType = {
    'available': 1,
    'table': 2,
    'bareIce': 3,
    'baggedIce': 4,
    'holedContainerPlace': 5,
    'imperforateContainerPlace': 6,
    'tsumitoriLabel': 7,
    'packingPlace': 8,
}

export const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]

export const validPos = (pos) => {
    if (pos[0] < 0) return false
    if (pos[0] >= LENGTH) return false
    if (pos[1] < 0) return false
    if (pos[1] >= WIDTH) return false
    return true
}

const gridCell = (pos, type = 'available', value = null) => {
    return {
        x: pos[0],
        y: pos[1],
        type: gridType[type],
        value: value
    }
}

const initLayoutGrid = () => {
    const layoutGrid = []
    for (let i = 0; i < LENGTH; i++) {
        const row = Array(WIDTH)
        for (let j = 0; j < WIDTH; j++) {
            let cell
            const pos = [i + 1, j + 1]
            if (i < CONTAINER_PLACE_LENGTH) {
                if (j < WIDTH / 2) cell = gridCell(pos, 'holedContainerPlace')
                else cell = gridCell(pos, 'imperforateContainerPlace')
            } else if (i >= PACKING_PLACE_LENGTH) {
                cell = gridCell(pos, 'packingPlace')
            } else {
                cell = gridCell(pos)
            }
            row[j] = cell
        }
        layoutGrid.push(row)
    }
    return layoutGrid
}

const layoutGrid = derived(
    [output.tablePosition, output.bareIcePosition, output.baggedIcePosition, output.customerOrders, input.selectedQuery],
    ([$tablePosition, $bareIcePosition, $baggedIcePosition, $customerOrders, $selectedQuery]) => {
        const layoutGrid = initLayoutGrid()
        const customerOrder = $customerOrders[0]
        for (const table of $tablePosition) {
            let [x, y, direction, serialNum1, serialNum2] = table
            if (!validPos([x, y])) [x, y] = [0, 0]
            layoutGrid[x][y] = gridCell([x, y], 'table', customerOrder[serialNum1 - 1])
            if (direction === 0) {
                layoutGrid[x + 1][y] = gridCell([x + 1, y], 'table', customerOrder[serialNum2 - 1])
            } else {
                layoutGrid[x][y + 1] = gridCell([x, y + 1], 'table', customerOrder[serialNum2 - 1])
            }
        }
        for (const bareIce of $bareIcePosition) {
            let [x, y] = bareIce
            if (!validPos([x, y])) [x, y] = [0, 0]
            layoutGrid[x][y] = gridCell([x, y], 'bareIce')
        }
        for (const baggedIce of $baggedIcePosition) {            
            let [x, y] = baggedIce
            if (!validPos([x, y])) [x, y] = [0, 0]
            layoutGrid[x][y] = gridCell([x, y], 'baggedIce')
        }
        return layoutGrid
    }
)

export const selectedCurrentTime = writable(0)
const uncompletedOrder = writable([])
output.customerOrders.subscribe((orders) => uncompletedOrder.set(orders))

// 特定の時刻における盤面の状態を表す
// layoutGridは机、バケツなど固定物の状態を表し、workerGridは作業者の位置と状態を表す
class WholeState {
    constructor(layoutGrid, workerGrid, customerOrders, currentTime = 0, completedWorker = 0) {
        this.layoutGrid = JSON.parse(JSON.stringify(layoutGrid))
        this.workerGrid = new WorkerGrid(workerGrid.workers)
        this.uncompletedOrders = customerOrders
        this.currentTime = currentTime
        this.completedWorker = completedWorker
    }
}

// 作業者の位置と状態を表す。tableに位置を表し、workersに各作業者の状態を表す
class WorkerGrid {
    constructor(workers, table = []) {
        this.table = table
        const newWorkers = workers.map(worker => Worker.dupWorker(worker))
        this.workers = newWorkers
        for (let i = 0; i < LENGTH; i++) {
            const row = Array(WIDTH).fill(null)
            this.table.push(row)
        }
        for (const worker of workers) {
            this.table[worker.x][worker.y] = worker
        }
    }
}

const initWorkers = () => {
    const workers = []
    for (let i = 0; i < WORKER_NUM; i++) {
        const worker = new Worker([PACKING_PLACE_LENGTH - 1, i + 2])
        workers.push(worker)
    }
    return workers
}

const iceType = (targetCustomer) => {
    const customerOrder = get(input.inputQueries)[0][targetCustomer - 1]
    if (!customerOrder || customerOrder.length === 0) return 0
    return customerOrder.slice(-1)[0]
}

const assignTargetCustomer = (worker, customerOrders) => {
    worker.targetCustomer = customerOrders[Math.floor(Math.random() * customerOrders.length)]
    worker.targetIceType = iceType(worker.targetCustomer)
    const restCustomerOrders = customerOrders.filter(customer => customer !== worker.targetCustomer)
    return [worker, restCustomerOrders]
}


// 全体の状態の時系列を一元管理している配列
// 各時刻の状態を表すwholeStateの配列
export const wholeStateSeries = derived(
    [layoutGrid, output.customerOrders],
    ([$layoutGrid, $customerOrders]) => {
        if ($customerOrders.length === 0) return []
        const workers = initWorkers()
        
        let restCustomerOrders = $customerOrders[0]
        const assignedWorkers = []
        for (let worker of workers) {
            let assignedWorker
            [assignedWorker, restCustomerOrders] = assignTargetCustomer(worker, restCustomerOrders)
            assignedWorkers.push(assignedWorker)
            if (restCustomerOrders.length === 0) break
        }
        const workerGrid = new WorkerGrid(workers)
        const initWholeState = new WholeState($layoutGrid, workerGrid, restCustomerOrders)
        const wholeStateSeries = [initWholeState]
        let currentWholeState = initWholeState
        let nextWholeState = tickWholeState(initWholeState)

        while(nextWholeState.completedWorker < WORKER_NUM && wholeStateSeries.length < 1000) {
            wholeStateSeries.push(nextWholeState)
            currentWholeState = nextWholeState
            nextWholeState = tickWholeState(currentWholeState)
        }
        return wholeStateSeries
    }
)

// wholeStateを渡して、次の時刻のwholeStateを求める
export const tickWholeState = (wholeState) => {
    let completedWorker = wholeState.completedWorker
    const newWholeState = new WholeState(wholeState.layoutGrid, wholeState.workerGrid, wholeState.uncompletedOrders)
    const layoutGrid = newWholeState.layoutGrid
    const workerGrid = newWholeState.workerGrid
    const workers = workerGrid.workers
    let uncompletedOrders = newWholeState.uncompletedOrders

    let nextWorkerGridTable = workerGrid.table
    const nextWorkers = []
    for (let worker of workers) {
        if (nextWorkerGridTable[worker.x][worker.y] === null) continue
        if (worker.targetCustomer === 0) {
            // 未完了の注文があったらそれを割り当てて、なかったらその作業者は完了とする
            if (uncompletedOrders.length > 0) {
                [worker, uncompletedOrders] = assignTargetCustomer(worker, uncompletedOrders)
                nextWorkerGridTable[worker.x][worker.y] = worker
                nextWorkers.push(worker)
            } else {
                nextWorkerGridTable[worker.x][worker.y] = null
                completedWorker++
            }
            continue
        }

        worker.setDestination(layoutGrid)
        const nextWorker = moveWorker(worker, layoutGrid, nextWorkerGridTable)
        worker = nextWorker[0]
        nextWorkerGridTable = nextWorker[1]
        nextWorkers.push(worker)
    }
    workerGrid.workers = nextWorkers
    workerGrid.table = nextWorkerGridTable
    const nextWholeState = new WholeState(layoutGrid, workerGrid, uncompletedOrders, wholeState.currentTime + 1, completedWorker)
    return nextWholeState
}

// 作業者を動かす。他の作業者などの影響で最短距離で移動できるとは限らないので、補正して動けた方向に動く。
const moveWorker = (worker, layoutGrid, nextWorkerGridTable) => {
    const currentPos = [worker.x, worker.y]
    for (let i = 0; i < 4; i++) {
        const fixedDirection = fixDirection(worker.wishDirection, i)
        const nextPos = [currentPos[0] + fixedDirection[0], currentPos[1] + fixedDirection[1]]

        if (!validPos(nextPos)) continue
        if (worker.destination[0] === nextPos[0] && worker.destination[1] === nextPos[1]) {
            const broughtProduct = worker.updateState()
            if (broughtProduct) layoutGrid[nextPos[0]][nextPos[1]].value = null

            nextWorkerGridTable[currentPos[0]][currentPos[1]] = worker
            break
        }
        if (layoutGrid[nextPos[0]][nextPos[1]].type === gridType['available'] && !nextWorkerGridTable[nextPos[0]][nextPos[1]]) {
            worker.x = nextPos[0]
            worker.y = nextPos[1]
            nextWorkerGridTable[nextPos[0]][nextPos[1]] = nextWorkerGridTable[currentPos[0]][currentPos[1]]
            nextWorkerGridTable[currentPos[0]][currentPos[1]] = null
            break
        }
    }
    return [worker, nextWorkerGridTable]
}

// 目的の方向に動けなかった場合は、進行方向の左、右、後ろの優先度で、別の方向に移動する
const fixDirection = (direction, priority) => {
    const original_direction = directions[direction]
    let fixedDirection
    switch(priority) {
        case 0:
            return original_direction
        case 1:
            fixedDirection = [-original_direction[1], original_direction[0]]
            break
        case 2:
            fixedDirection = [original_direction[1], -original_direction[0]]
            break
        case 3:
            fixedDirection = [-original_direction[0], -original_direction[1]]
            break
    }
    return fixedDirection
}
