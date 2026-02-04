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
