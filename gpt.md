# Thoughts?
## `index.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Markup from "./tokeniser/index.js";
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
## `parser/index.ts`
```ts
import Node from "../renderer/index.js";
import { type Inline } from "../utils/index.js";
import { parse } from "./parse.js";
export type Token =
	| { type: "text"; text: string }
	| { type: "open" | "close"; inline: Inline };
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
## `parser/parse.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Node from "../renderer/index.js";
import type Tokens from "./index.js";
export const parse = (THIS: Tokens, ...file: string[]): Node => {
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
## `renderer/index.ts`
```ts
import { escapes, type Inline, type InlineSymbol } from "../utils/index.js";
import { push } from "./push.js";
import { toString } from "./toString.js";
import { render } from "./render.js";
export type NodeType = "root" | "text" | Inline;
export const htmlTags = {
	bold: "b",
	italic: "i",
	underline: "u",
};
export const unEscapes = Object.fromEntries(
	Object.entries(escapes).map(([k, v]: [InlineSymbol, string]) => [v, k]),
);
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
## `renderer/push.ts`
```ts
import type Node from "./index.js";
export const push = (THIS: Node, ...children: Node[]): void => {
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
import { escapes } from "../utils/index.js";
import Node, { htmlTags, unEscapes } from "./index.js";
export const render = (THIS: Node, ...file: string[]): string => {
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
import type Node from "./index.js";
export const toString = (THIS: Node): string => {
	return JSON.stringify(
		THIS,
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
			}
		},
		"\t",
	);
};
```
## `tokeniser/index.ts`
```ts
import { type Inline, type InlineSymbol } from "../utils/index.js";
import Tokens from "../parser/index.js";
import { tokenise } from "./tokenise.js";
export const regexJoin = (regexes: RegExp[]): RegExp =>
	new RegExp(
		regexes.map((r) => r.source).join("|"),
		[...new Set(regexes.flatMap((r) => [...r.flags]))]
			.filter((i) => !["g", "y"].includes(i))
			.sort()
			.join(""),
	);
const genInline = (symbol: InlineSymbol, label: Inline): RegExp => {
	let newSymbol: string = symbol;
	if (["*"].includes(symbol)) newSymbol = `\\${symbol}`;
	return new RegExp(
		newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol,
	);
};
export const re: { [k: string]: RegExp | { [k: string]: RegExp } } = {
	inline: Object.fromEntries(
		Object.entries({
			bold: "*",
			italic: "/",
			underline: "_",
		}).map(([k, v]: [Inline, InlineSymbol]) => [k, genInline(v, k)]),
	),
};
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
## `tokeniser/tokenise.ts`
```ts
import fs from "node:fs";
import path from "node:path";
import Tokens, { type Token } from "../parser/index.js";
import { escapes, type Inline } from "../utils/index.js";
import Markup, { regexJoin, re } from "./index.js";
/** @todo Use escaped text tokens instead of `this.input.replace(...)` */
export const tokenise = (THIS: Markup, ...file: string[]): Tokens => {
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
## `utils/index.ts`
```ts
export type InlineSymbol = "*" | "/" | "_";
export const escapes: Record<InlineSymbol, string> = Object.entries({
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
export type Inline = "bold" | "italic" | "underline";
```
