const width = 25;
const length = 25;
const containerPlaceLength = 2;
const packingPlaceLength = 3;

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

const gridState = (pos, type = 'available', value = null) => {
    return {
        x: pos[0],
        y: pos[1],
        type: gridType[type],
        value: value
    }
}

const initLayoutGrid = () => {
    const layoutGrid = []
    for(let i = 0; i < length; i++) {
        const row = Array(width)
        for(let j = 0; j < width; j++) {
            let cell;
            const pos = [i + 1, j + 1]
            if (i < containerPlaceLength) {
                if (j < width / 2) cell = gridState(pos, 'holedContainerPlace')
                else cell = gridState(pos, 'imperforateContainerPlace')
            } else if (i >= length - packingPlaceLength) {
                cell = gridState(pos, 'packingPlace')
            } else {
                cell = gridState(pos)
            }
            row[j] = cell
        }
        layoutGrid.push(row)
    }
    return layoutGrid
}
