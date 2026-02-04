import fs from "fs";
import path from "path";
const htmlTags = {
	bold: "b",
	italic: "i",
	underline: "u",
};
function regexJoin(regexes: RegExp[]): RegExp {
	return new RegExp(
		regexes.map((r) => r.source).join("|"),
		[...new Set(regexes.flatMap((r) => [...r.flags]))]
			.filter((i) => !["y"].includes(i))
			.sort()
			.join(""),
	);
}
type InlineSymbol = "*" | "/" | "_";
const escapes: Record<InlineSymbol, string> = Object.entries({
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
type Inline = "bold" | "italic" | "underline";
function genInline(symbol: InlineSymbol, label: Inline): RegExp {
	let newSymbol: string = symbol;
	if (["*"].includes(symbol)) newSymbol = `\\${symbol}`;
	return new RegExp(
		newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol,
	);
}
type TokenType = "text" | `${Inline}_${"open" | "close"}`;
class Token {
	type: TokenType;
	text?: string;
	constructor(options: { type: TokenType; text?: string }) {
		this.type = options.type;
		this.text = options.text;
	}
}
const unEscapes = Object.fromEntries(
	Object.entries(escapes).map(([k, v]: [InlineSymbol, string]) => [v, k]),
);
type NodeType = "root" | "text" | Inline;
class Node {
	type: NodeType;
	text?: string | null;
	children: Node[];
	constructor(options: {
		type?: NodeType;
		text?: string;
		children?: Node[];
	}) {
		this.type = options.type ?? "text";
		this.text = options.text;
		this.children = options.children ?? [];
	}
	push(...children: Node[]) {
		for (const child of children)
			if (
				child?.type !== "text" ||
				child?.text?.length > 0 ||
				child?.children.length > 0
			)
				this.children.push(child);
	}
	toString(): string {
		return JSON.stringify(
			this,
			(
				_: string,
				node: Node,
			): string | Node | Node[] | Record<string, Node | Node[]> => {
				switch (node?.type) {
					case "root":
						return node.children;
					case "text":
						return node.text;
					case "bold":
					case "italic":
					case "underline":
						return {
							[node.type]:
								node.children.length > 1
									? node.children
									: node.children[0],
						};
					default:
						return node;
				}
			},
			"\t",
		);
	}
	render(log = false, file: string = null): string {
		switch (this.type) {
			case "root": {
				const out = this.children.map((i) => i.render()).join("");
				if (log) {
					if (file) fs.writeFileSync(file, out);
					else console.log(out);
				}
				return out;
			}
			case "bold":
			case "italic":
			case "underline": {
				const tag = htmlTags[this.type];
				return `<${tag}>${this.children.map((i) => i.render()).join("")}</${tag}>`;
			}
			case "text":
				return this.text.replace(
					RegExp(Object.values(escapes).join("|"), "g"),
					(x) => unEscapes[x],
				);
		}
	}
}
class TokenArray {
	tokens: Token[];
	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}
	get length() {
		return this.tokens.length;
	}
	*[Symbol.iterator]() {
		for (const token of this.tokens) yield token;
	}
	parse(log = false, file: string = null): Node {
		const tree: Node = new Node({ type: "root" });
		const stack = [tree];
		for (const token of this) {
			const current = stack.at(-1);
			if (token.type === "text")
				current.push(new Node({ text: token.text }));
			else if (token.type.endsWith("open")) {
				const node = new Node({
					type: token.type.replace(
						/^(.*?)_open$/,
						(_, m) => m,
					) as NodeType,
				});
				current.push(node);
				stack.push(node);
			} else if (token.type.endsWith("close")) {
				if (stack.length === 1)
					throw new Error(`Unexpected Closing tag: <${token.type}>`);
				stack.pop();
			}
		}
		if (log) {
			const out = tree.toString();
			if (file) fs.writeFileSync(file, out);
			else console.log(out);
		}
		return tree;
	}
}
const symbols = {
	bold: "*",
	italic: "/",
	underline: "_",
};
const re: { [k: string]: RegExp | { [k: string]: RegExp } } = {
	inline: Object.fromEntries(
		Object.entries(symbols).map(([k, v]: [Inline, InlineSymbol]) => [
			k,
			genInline(v, k),
		]),
	),
};
/*console.log(
	regexJoin(
		Object.values(symbols).map(
			(i) => new RegExp(i.replace(/[*]/g, (m) => `\\${m}`)),
		),
	),
);*/
class Compiler {
	input: string;
	constructor(input: string) {
		this.input = input;
	}
	/**
	 * @todo Use escape tokens instead of `this.input.replace()`
	 */
	tokenise(log = false, file?: string): TokenArray {
		let output = this.input.replace(
			RegExp(
				`\\\\(${Object.keys(escapes)
					.map((i) => {
						if (["*"].includes(i)) return `\\${i}`;
						else return i;
					})
					.join("|")})`,
				"g",
			),
			(_, m) => escapes[m],
		);
		const tokens: Token[] = [];
		re["all"] = regexJoin(
			Object.entries(re)
				.map(([_, v]) => {
					if (v instanceof RegExp) return v;
					else return Object.values(v);
				})
				.flat(),
		);
		while (re["all"].test(output)) {
			let best = null;
			for (const r of Object.values(re["inline"])) {
				const match = output.match(r);
				if (!match) continue;
				else if (!best || match.index < best.match.index)
					best = { regex: r, match };
			}
			const match = best.match;
			const parts = output.split(match[0]);
			const pre = parts[0];
			const type = Object.keys(best.match.groups)[0].replace(
				/(.*?)_text/,
				(_, m) => m,
			) as Inline;
			if (pre.length) tokens.push(new Token({ type: "text", text: pre }));
			const content = match[1];
			const contentTokens = new Compiler(content).tokenise();
			tokens.push(new Token({ type: `${type}_open` }));
			if (contentTokens.length === 1)
				tokens.push(new Token({ type: "text", text: content }));
			else tokens.push(...contentTokens);
			tokens.push(new Token({ type: `${type}_close` }));
			output = parts.at(-1);
		}
		tokens.push(new Token({ type: "text", text: output }));
		if (log) {
			const out = JSON.stringify(
				tokens
					.map((i) => {
						if (i.type === "text") return i.text;
						else return i.type;
					})
					.filter(Boolean),
				null,
				"\t",
			);
			if (file) fs.writeFileSync(file, out);
			else console.log(out);
		}
		return new TokenArray(tokens);
	}
}
const tests = [
	"*1 /2 _3 *4 /5/ 6* 7_ 8/ 9*",
	"**a*Test**c*",
	"*bold /italic* text/",
];
for (let i = 0; i < tests.length; i++) {
	const dir = path.join("tests", String(i + 1));
	fs.mkdirSync(dir, { recursive: true });
	new Compiler(tests[i])
		.tokenise(true, path.join(dir, "1-tokens.json"))
		.parse(true, path.join(dir, "2-nodes.json"))
		.render(true, path.join(dir, "3-render.html"));
}
