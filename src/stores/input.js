import { get, writable, derived } from 'svelte/store'
import { Random } from '../util';

const minCustomers = 10
const maxCustomers = 60
const minProducts = 1
const maxProducts = 10

export const Input = () => {
    const createInputQueries = (seed, queryNum) => {
        const allQueries = []
        const random = new Random(new Random(seed).next())
        Array(queryNum).fill().forEach(() => {
            const customers = random.nextInt(minCustomers, maxCustomers)
            const query = [];
            Array(customers).fill().forEach(() => {
                const products = random.nextInt(minProducts, maxProducts)
                const sku = random.nextInt(products, products * 5)
                const weight = random.nextInt(sku, sku * 10)
                const ice = Math.abs(random.next()) % 2
                query.push([products, sku, weight, ice])
            })
            allQueries.push(query)
        })
        return allQueries
    }

    const queryToString = (inputQueries) => {
        const rows = []
        rows.push(inputQueries.length.toString())
        for(const query of inputQueries) {
            rows.push(query.length.toString())
            for(const detail of query) {
                rows.push(detail.join(' '))
            }
        }
        return rows.join('\n')
    }

    const seed = writable(0)
    const queryNum = writable(1)
    const selectedQuery = writable(1)
    const inputValue = writable('')
    seed.subscribe((value) => {
        const inputQueries = createInputQueries(value, get(queryNum))
        inputValue.set(queryToString(inputQueries))
    })
    queryNum.subscribe((value) => {
        const inputQueries = createInputQueries(get(seed), value)
        inputValue.set(queryToString(inputQueries))
    })

    const inputQueries = writable([])
    inputValue.subscribe((value) => {
        const rows = value.split('\n')
        const newQueryNum = Number(rows[0])
        queryNum.set(newQueryNum)
        let curLine = 1
        const newInputQueries = []
        for(let i = 1; i <= newQueryNum; i++) {
            const customerNum = Number(rows[curLine])
            curLine++
            const detail = []
            for(let j = curLine; j < curLine + customerNum; j++) {
                if (!rows[j]) {
                    curLine = j;
                    break;
                }
                detail.push(rows[j].split(' ').map((v) => Number(v)))
            }
            newInputQueries.push(detail)
            if (rows.length < curLine) break;
            curLine += customerNum
        }
        inputQueries.set(newInputQueries)
    })
    return {
        seed, queryNum, selectedQuery, inputQueries, inputValue
    }
}