export default (symbol, label) => {
    let newSymbol = symbol;
    if (["*"].includes(symbol))
        newSymbol = `\\${symbol}`;
    return new RegExp(newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol);
};
