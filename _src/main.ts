function regexJoin(...a: RegExp[]): RegExp {
	const flags: string[] = [];
	return RegExp(
		a
			.map((i) => {
				return `${i}`
					.replace(/([a-z]+)$/, (_, m: string) => {
						for (const c of m) {
							flags.push(c);
						}
						return "";
					})
					.replace(/^\/|\/$/g, "");
			})
			.join("|"),
		[...new Set(flags)].sort().join(""),
	);
}
type Symbols = "*" | "/" | "_";
const escapes: Record<Symbols, string> = Object.entries({
	"*": "star",
	"/": "slash",
	_: "underscore",
}).reduce<Record<string, string>>(
	(acc: Record<Symbols, string>, [k, v]: [Symbols, string]) => {
		acc[k] = `\0${v.toUpperCase()}\0`;
		return acc;
	},
	{},
);
const unEscapes: Record<string, Symbols> = Object.fromEntries(
	Object.entries(escapes).map(([k, v]: [Symbols, string]) => [v, k]),
);
function genInline(symbol: Symbols, label: Inline) {
	let newSymbol: string;
	switch (symbol) {
		case "*":
			newSymbol = `\\${symbol}`;
			break;
		default:
			newSymbol = symbol;
	}
	return new RegExp(
		`${newSymbol}(?!\\s)(?<${label}_text>[^\\n]+?)(?<!\\s)${newSymbol}`,
	);
}
function escape(input: string): string {
	return input.replace(
		RegExp(
			`\\\\(${Object.keys(escapes)
				.map((i) => {
					switch (i) {
						case "*":
							return `\\${i}`;
						default:
							return i;
					}
				})
				.join("|")})`,
			"g",
		),
		(_, m) => escapes[m],
	);
}
export type Inline = "bold" | "italic" | "underline";
function tokenise(input: string): string[] {
	const tokens: string[] = [];
	input = escape(input);
	const re: { inline: Record<Inline, RegExp> } = {
		inline: {
			bold: genInline("*", "bold"),
			italic: genInline("/", "italic"),
			underline: genInline("_", "underline"),
		},
	};
	re["all"] = regexJoin(
		...Object.values(re)
			.map((i) => {
				if (i instanceof RegExp) {
					return i;
				} else {
					return Object.values(i);
				}
			})
			.flat(),
	);
	all: while (re["all"].test(input)) {
		//for (const [k, v] of Object.entries(re.inline)) {
		if (re["all"].test(input)) {
			const matches = input.match(re["all"]);
			let type = Object.keys(matches.groups)[0];
			console.log(type);
			type = type.replace(/^(.*?)_text$/, (_, m) => m);
			console.log(type);
			const parts = input.split(matches[0]);
			tokens.push(...tokenise(parts[0]));
			tokens.push(`[[${type}_open]]`);
			tokens.push(...tokenise(matches.groups[`${type}_text`]));
			tokens.push(`[[${type}_close]]`);
			input = parts.at(-1);
			continue all;
		}
		//}
	}
	tokens.push(input);
	return tokens;
}
export function unEscape(input: string): string {
	return input.replace(
		RegExp(Object.values(escapes).join("|"), "g"),
		(x) => unEscapes[x],
	);
}
const text = "/Hello/, _*World*!_";
console.log(text);
console.log(JSON.stringify(tokenise(text) /*.map(unEscape)*/, null, 4));
