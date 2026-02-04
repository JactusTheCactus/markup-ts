import Node from "../renderer/Node.js";
import parse from "./parse.js";
export default class Tokens {
    tokens;
    constructor(tokens) {
        this.tokens = tokens;
    }
    get length() {
        return this.tokens.length;
    }
    *[Symbol.iterator]() {
        for (const token of this.tokens)
            yield token;
    }
    parse(...file) {
        return parse(this, ...file);
    }
}
