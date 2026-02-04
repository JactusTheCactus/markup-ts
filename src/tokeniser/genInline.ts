import type { Inline } from "../utils/Inline.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
export default (symbol: InlineSymbol, label: Inline): RegExp => {
	let newSymbol: string = symbol;
	if (["*"].includes(symbol)) newSymbol = `\\${symbol}`;
	return new RegExp(
		newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol,
	);
};
