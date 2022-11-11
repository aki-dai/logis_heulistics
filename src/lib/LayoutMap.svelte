<script>
  import { input, gridType, selectedCurrentTime, wholeStateSeries } from '../store.js'
  let { inputQueries, selectedQuery } = input
  let options = []
  inputQueries.subscribe((queries) => {
    options = []
    for (let i = 0; i < queries.length; i++) {
      options.push({
        id: i + 1,
        text: `クエリ${i + 1}, 顧客数: ${queries[i].length}`
      })
    }
  })
  let currentState
  $: currentState = $wholeStateSeries[$selectedCurrentTime]
  let layoutGrid, workerGrid
  $: layoutGrid = (currentState) ? currentState.layoutGrid : [[]]
  $: workerGrid = (currentState) ? currentState.workerGrid.table : [[]]
</script>

<div>
  <label for="query-select">クエリ番号</label>
  <select bind:value={$selectedQuery} id="query-select">
    {#each options as option}
      <option value={option.id}>
        {option.text}
      </option>
    {/each}
  </select>
</div>

<div>
  <label for="current-time">時間</label>
  <input type="range" id="current-time" min="0" max={$wholeStateSeries.length - 1} step="1" bind:value={$selectedCurrentTime}>
  {$selectedCurrentTime} / {$wholeStateSeries.length - 1}
</div>

<div class="layout-grid-container">
  {#each layoutGrid as row, i}
    <div class="row">
      {#each row as cell, j}
        <div class="cell"
          class:holed-container={cell.type === gridType['holedContainerPlace']}
          class:imperforate-container={cell.type === gridType['imperforateContainerPlace']}
          class:packing-place={cell.type === gridType['packingPlace']}
          class:table={cell.type === gridType['table']}
          class:bare-ice={cell.type === gridType['bareIce']}
          class:bagged-ice={cell.type === gridType['baggedIce']}
        >
          <span class="value">{(cell.value && !(cell.type === gridType['table'] && cell.value > $inputQueries[0].length)) ? cell.value : ''}</span>
          {#if workerGrid[i][j]}
            <span
              class="worker"
              class:has-holed-container={workerGrid[i][j].hasContainer && workerGrid[i][j].targetIceType === 0 }
              class:has-imperforate-container={workerGrid[i][j].hasContainer && workerGrid[i][j].targetIceType === 1 }
              class:has-product={workerGrid[i][j].hasProduct}
              class:has-ice={workerGrid[i][j].hasIce}
            >
              {workerGrid[i][j].targetCustomer}
            </span>
            
            <div class="state-badges">
              {#if workerGrid[i][j].hasContainer}
                <span class="has-container {workerGrid[i][j].targetIceType === 0 ? 'has-holed-container' : 'has-imperforate-container'}">●</span>
              {/if}
              {#if workerGrid[i][j].hasProduct}
                <span class="has-product">●</span>
              {/if}
              {#if workerGrid[i][j].hasIce}
                <span class="has-ice {workerGrid[i][j].targetIceType === 0 ? 'has-bare-ice' : 'has-bagged-ice'}">●</span>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  label {
      display: inline-block;
      width: 100px;
  }
  select {
		width: 345px;
  }

  div.layout-grid-container {
    margin: 10px, 0;
  }

  div.row {
    display: flex;
  }

  div.cell {
    display: inline-block;
    width: 30px;
    height: 30px;
    line-height: 30px;
    font-size: 20px;
    border: solid 1px lightgray;
    text-align: center;
  }

  .cell > .value {
    color: white;
  }

  span.worker {
    display: inline-block;
    position: relative;
    color: black;
    padding-top: 3px;
  }

  div.state-badges {
    position: relative;
    letter-spacing: -4px;
    left: -2px;
    top: -45px;
  }

  .has-holed-container {
    color: green;
  }
  .has-imperforate-container {
    color: palegreen;
  }
  .has-product {
    color: brown;
  }
  .has-bare-ice {
    color: blue;
  }
  .has-bagged-ice {
    color: paleturquoise;
  }

  .imperforate-container {
    background-color: palegreen;
  }
  
  .holed-container {
    background-color: green;
  }

  div.packing-place {
    background-color: palevioletred;
  }
  
  div.table {
    background-color: brown;
  }

  .bare-ice {
    background-color: blue;
  }

  .bagged-ice {
    background-color: paleturquoise;
  }
</style>
