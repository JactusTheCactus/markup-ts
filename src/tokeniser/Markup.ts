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
