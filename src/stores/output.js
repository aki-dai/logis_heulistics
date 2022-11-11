import { get, writable } from 'svelte/store'

const initOutputValue = `25
5 5 0 10 9
7 5 0 8 7
9 5 0 6 5
11 5 0 4 3
13 5 0 2 1
5 6 0 20 19
7 6 0 18 17 
9 6 0 16 15 
11 6 0 14 13 
13 6 0 12 11 
5 12 0 30 29
7 12 0 28 27
9 12 0 26 25
11 12 0 24 23
13 12 0 22 21
5 13 0 40 39
7 13 0 38 37
9 13 0 36 35
11 13 0 34 33
13 13 0 32 31
5 19 0 50 49
7 19 0 48 47
9 19 0 46 45
11 19 0 44 43
13 19 0 42 41
2
11 2
8 9
2
11 22
8 16
2 3 6 7 9 15 17 19 21 22 23 24 25 26 27 33 36 37 39 40 41 43 45 46 47 1 4 5 8 10 11 12 13 14 16 18 20 28 29 30 31 32 34 35 38 42 44
`

export const Output = (input) => {
    const tablePosition = writable([])
    const bareIcePosition = writable([])
    const baggedIcePosition = writable([])
    const customerOrders = writable([])
    const outputValue = writable(initOutputValue)
    const queryNum = get(input.queryNum)
    outputValue.subscribe((value) => {
        try {
            const rows = value.split('\n')
            let rowIndex = 0
            const parseValue = (index, variable) => {
                const num = Number(rows[index])
                index++
                const tmp = Array(num)
                for(let i = 0; i < num; i++) {
                    tmp[i] = rows[index].split(' ').map(value => Number(value))
                    index++
                }
                variable.set(tmp)
                return index
            }
    
            rowIndex = parseValue(rowIndex, tablePosition)
            rowIndex = parseValue(rowIndex, bareIcePosition)
            rowIndex = parseValue(rowIndex, baggedIcePosition)
            const customerOrderArray = []
            for(let i = 0; i < queryNum; i++) {
                const rowValues = rows[rowIndex + i].split(' ').map(value => Number(value))
                customerOrderArray.push(rowValues)
            }
            customerOrders.set(customerOrderArray)
        } catch {
            return {}
        }
    })
    return {
        tablePosition, bareIcePosition, baggedIcePosition, customerOrders, outputValue
    }
}

