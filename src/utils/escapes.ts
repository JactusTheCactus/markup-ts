import type { InlineSymbol } from "./InlineSymbol.js";
export default Object.entries({
	"*": "star",
	"/": "slash",
	_: "underscore",
}).reduce<Record<string, string>>(
	(acc: Record<InlineSymbol, string>, [k, v]: [InlineSymbol, string]) => {
		acc[k] = `\0${v.toUpperCase()}\0`;
		return acc;
	},
	{},
);
