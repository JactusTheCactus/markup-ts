import Tokens from "../parser/Tokens.js";
import tokenise from "./tokenise.js";
export default class Markup {
    input;
    constructor(input) {
        this.input = input;
    }
    tokenise(...file) {
        return tokenise(this, ...file);
    }
}
