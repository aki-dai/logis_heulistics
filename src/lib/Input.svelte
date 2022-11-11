<script>
    import { input, output } from '../store'
    let { seed, queryNum, inputValue } = input
    let { outputValue } = output
</script>

<div>
    <label for="seed">乱数シード</label>
    <input type="number" id="seed" bind:value={$seed}>
</div>
<div>
    <label for="picking-number">クエリ数</label>
    <input type="number" id="picking-number" min=1 max=1000 bind:value={$queryNum} on:change>
</div>
<div>
    <label for="products">入力</label>
    <textarea id="products" rows="5" cols="40" bind:value={$inputValue} wrap="off"></textarea>
</div>

<div>
    <label for="output">出力</label>
    <textarea id="output" rows="5" cols="40" bind:value={$outputValue} wrap="off"></textarea>
</div>

<style>
    label {
        display: inline-block;
        width: 100px;
    }
    textarea {
        font-size: 16px;
    }
</style>