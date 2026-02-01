/*type TokenType =
    | "text"
    | `${"bold" | "italic" | "underline"}_${"open" | "close"}`;
class Token {
    type: TokenType;
    text?: string;
    children?: Token[];
    constructor(options: {
        type: TokenType;
        text?: string;
        children?: Token[];
    }) {
        this.type = options.type;
        this.text = options.text ?? "";
        this.children = options.children ?? [];
    }
}*/
function tokenise(_input) {
    const tokens = [];
    for (let i = 0; i < 10; i++) {
        tokens.push(i);
    }
    return tokens;
}
const text = "*Bold* /Italic/ _Underline_";
console.log(text);
console.log(tokenise(text));
export {};
//console.log(JSON.stringify(tokenise(text), null, 4));
