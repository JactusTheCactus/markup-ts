# Thoughts?
## `index.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Markup from "./tokeniser/Markup.js";
[
	["*Bold*", "Not \\*Bold\\*"],
	["*1 /2 _3_ 4/ 5*", "/1 _2 *3* 4_ 5/", "_1 *2 /3/ 4* 5_"],
	"**a*Test**c*",
	"*bold /italic* text/",
].forEach((test: string | string[], index: number) => {
	const dir = path.join("tests", String(index));
	fs.mkdirSync(dir, { recursive: true });
	new Markup(
		typeof test === "object"
			? test.map((n) => n.trim()).join("\n")
			: test.trim(),
	)
		.tokenise(dir, "1-tokens.json")
		.parse(dir, "2-nodes.json")
		.render(dir, "3-render.html");
});
```
## `parser/parse.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Node from "../renderer/Node.js";
import Tokens from "./Tokens.js";
export default (THIS: Tokens, ...file: string[]): Node => {
	const tree: Node = new Node({ type: "root" });
	const stack = [tree];
	for (const token of THIS) {
		const current = stack.at(-1);
		switch (token.type) {
			case "text":
				current.push(new Node({ text: token.text }));
				break;
			case "open": {
				const node = new Node({ type: token.inline });
				current.push(node);
				stack.push(node);
				break;
			}
			case "close":
				if (stack.length === 1)
					throw new Error(`Unexpected Closing tag: <${token.type}>`);
				stack.pop();
				break;
		}
	}
	if (file.length) fs.writeFileSync(path.join(...file), tree.toString());
	return tree;
};
```
## `parser/Tokens.ts`
```ts
import Node from "../renderer/Node.js";
import parse from "./parse.js";
import type { Token } from "./Token.js";
export default class Tokens {
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
	parse(...file: string[]): Node {
		return parse(this, ...file);
	}
}
```
## `parser/Token.ts`
```ts
import type { Inline } from "../utils/Inline.js";
export type Token =
	| { type: "text"; text: string }
	| { type: "open" | "close"; inline: Inline };
```
## `renderer/htmlTags.ts`
```ts
export default {
	bold: "b",
	italic: "i",
	underline: "u",
};
```
## `renderer/Node.ts`
```ts
import type { NodeType } from "./NodeType.js";
import push from "./push.js";
import render from "./render.js";
import toString from "./toString.js";
export default class Node {
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
	push(...children: Node[]): void {
		push(this, ...children);
	}
	toString(): string {
		return toString(this);
	}
	render(...file: string[]): string {
		return render(this, ...file);
	}
}
```
## `renderer/NodeType.ts`
```ts
import type { Inline } from "../utils/Inline.js";
export type NodeType = "root" | "text" | Inline;
```
## `renderer/push.ts`
```ts
import Node from "./Node.js";
export default (THIS: Node, ...children: Node[]): void => {
	for (const child of children)
		if (
			child?.type !== "text" ||
			child?.text?.length > 0 ||
			child?.children.length > 0
		)
			THIS.children.push(child);
};
```
## `renderer/render.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import escapes from "../utils/escapes.js";
import Node from "./Node.js";
import unEscapes from "./unEscapes.js";
import htmlTags from "./htmlTags.js";
export default (THIS: Node, ...file: string[]): string => {
	switch (THIS.type) {
		case "root": {
			const out = THIS.children.map((i) => i.render()).join("");
			if (file.length) fs.writeFileSync(path.join(...file), out);
			return out;
		}
		case "bold":
		case "italic":
		case "underline": {
			const tag = htmlTags[THIS.type];
			return `<${tag}>${THIS.children.map((i) => i.render()).join("")}</${tag}>`;
		}
		case "text":
			return THIS.text.replace(
				RegExp(Object.values(escapes).join("|"), "g"),
				(m) => unEscapes[m],
			);
	}
};
```
## `renderer/toString.ts`
```ts
import Node from "./Node.js";
export default (THIS: Node): string => {
	function fmt(input: Node) {
		let { type, text, children } = { ...input };
		switch (type) {
			case "root":
				return children.map(fmt);
			case "text":
				return text;
			case "bold":
			case "italic":
			case "underline":
				return {
					[type]:
						children.length > 1
							? children.map(fmt)
							: fmt(children[0]),
				};
		}
	}
	return JSON.stringify(fmt(THIS), null, "\t");
};
```
## `renderer/unEscapes.ts`
```ts
import escapes from "../utils/escapes.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
export default Object.fromEntries(
	Object.entries(escapes).map(([k, v]: [InlineSymbol, string]) => [v, k]),
);
```
## `tokeniser/genInline.ts`
```ts
import type { Inline } from "../utils/Inline.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
export default (symbol: InlineSymbol, label: Inline): RegExp => {
	let newSymbol: string = symbol;
	if (["*"].includes(symbol)) newSymbol = `\\${symbol}`;
	return new RegExp(
		newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol,
	);
};
```
## `tokeniser/Markup.ts`
```ts
import Tokens from "../parser/Tokens.js";
import tokenise from "./tokenise.js";
export default class Markup {
	input: string;
	constructor(input: string) {
		this.input = input;
	}
	tokenise(...file: string[]): Tokens {
		return tokenise(this, ...file);
	}
}
```
## `tokeniser/regexJoin.ts`
```ts
export default (regexes: RegExp[]): RegExp =>
	new RegExp(
		regexes.map((r) => r.source).join("|"),
		[...new Set(regexes.flatMap((r) => [...r.flags]))]
			.filter((i) => !["g", "y"].includes(i))
			.sort()
			.join(""),
	);
```
## `tokeniser/re.ts`
```ts
import type { Inline } from "../utils/Inline.js";
import type { InlineSymbol } from "../utils/InlineSymbol.js";
import genInline from "./genInline.js";
export default {
	inline: Object.fromEntries(
		Object.entries({
			bold: "*",
			italic: "/",
			underline: "_",
		}).map(([k, v]: [Inline, InlineSymbol]) => [k, genInline(v, k)]),
	),
};
```
## `tokeniser/tokenise.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Tokens from "../parser/Tokens.js";
import type { Token } from "../parser/Token.js";
import type { Inline } from "../utils/Inline.js";
import escapes from "../utils/escapes.js";
import Markup from "./Markup.js";
import re from "./re.js";
import regexJoin from "./regexJoin.js";
/** @todo Use escaped text tokens instead of `this.input.replace(...)` */
export default (THIS: Markup, ...file: string[]): Tokens => {
	const re_escape = RegExp(
		`\\\\(${Object.keys(escapes)
			.map((i) => (["*"].includes(i) ? `\\${i}` : i))
			.join("|")})`,
	);
	let output = THIS.input.replace(
		RegExp(re_escape, "g"),
		(_, m) => escapes[m],
	);
	const tokens: Token[] = [];
	const all = regexJoin(
		Object.entries(re)
			.map(([_, v]) => {
				if (v instanceof RegExp) return v;
				else return Object.values(v);
			})
			.flat(),
	);
	while (all.test(output)) {
		let best = null;
		for (const r of Object.values(re["inline"])) {
			const match = output.match(r);
			if (!match) continue;
			else if (!best || match.index < best.match.index)
				best = { regex: r, match };
		}
		const match = best.match;
		const start = match.index;
		const end = start + match[0].length;
		const before = output.slice(0, start);
		const after = output.slice(end);
		const type = Object.keys(best.match.groups)[0].replace(
			/(.*?)_text/,
			(_, m) => m,
		) as Inline;
		if (before.length) tokens.push({ type: "text", text: before });
		const content = match[1];
		const contentTokens = new Markup(content).tokenise();
		tokens.push({ inline: type, type: "open" });
		tokens.push(...contentTokens);
		tokens.push({ inline: type, type: "close" });
		output = after;
	}
	tokens.push({ type: "text", text: output });
	if (file.length)
		fs.writeFileSync(
			path.join(...file),
			JSON.stringify(
				tokens
					.map((i) => {
						if (i.type === "text") return i.text;
						else return `[${[i.inline, i.type].join("_")}]`;
					})
					.filter(Boolean),
				null,
				"\t",
			),
		);
	return new Tokens(tokens);
};
```
## `utils/escapes.ts`
```ts
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
```
## `utils/InlineSymbol.ts`
```ts
export type InlineSymbol = "*" | "/" | "_";
```
## `utils/Inline.ts`
```ts
export type Inline = "bold" | "italic" | "underline";
```
