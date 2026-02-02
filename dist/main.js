import fs from "fs";
const htmlTags = {
    bold: "b",
    italic: "i",
    underline: "u",
};
function regexJoin(...regexes) {
    return new RegExp(regexes.map((r) => r.source).join("|"), [...new Set(regexes.flatMap((r) => [...r.flags]))]
        .filter((i) => !["y"].includes(i))
        .sort()
        .join(""));
}
const escapes = Object.entries({
    "*": "star",
    "/": "slash",
    _: "underscore",
}).reduce((acc, [k, v]) => {
    acc[k] = "\0" + v.toUpperCase() + "\0";
    return acc;
}, {});
function genInline(symbol, label) {
    let newSymbol = symbol;
    if (["*"].includes(symbol))
        newSymbol = `\\${symbol}`;
    return new RegExp(newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol);
}
class Token {
    type;
    text;
    constructor(options) {
        this.type = options.type;
        this.text = options.text;
    }
}
const unEscapes = Object.fromEntries(Object.entries(escapes).map(([k, v]) => [v, k]));
class Node {
    type;
    text;
    children;
    constructor(options) {
        this.type = options.type ?? "text";
        this.text = options.text;
        this.children = options.children ?? [];
    }
    push(...children) {
        for (const child of children)
            if (child?.type !== "text" ||
                child?.text?.length > 0 ||
                child?.children.length > 0)
                this.children.push(child);
    }
    toString() {
        return JSON.stringify(this, (_, node) => {
            switch (node?.type) {
                case "root":
                    return node.children;
                case "text":
                    return node.text;
                case "bold":
                case "italic":
                case "underline":
                    if (node?.text === null)
                        delete node.text;
                    if (node?.children?.length === 0)
                        delete node.children;
                    return {
                        [node.type]: node.children.length > 1
                            ? node.children
                            : node.children[0],
                    };
                default:
                    return node;
            }
        }, "\t");
    }
    render(log = false, file = null) {
        switch (this.type) {
            case "root": {
                const out = this.children.map((i) => i.render()).join("");
                if (log) {
                    if (file)
                        fs.writeFileSync(file, out);
                    else
                        console.log(out);
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
                return this.text.replace(RegExp(Object.values(escapes).join("|"), "g"), (x) => unEscapes[x]);
        }
    }
}
class TokenArray {
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
    parse(log = false, file = null) {
        const tree = new Node({ type: "root" });
        const stack = [tree];
        for (const token of this) {
            const current = stack.at(-1);
            if (token.type === "text")
                current.push(new Node({ text: token.text }));
            else if (token.type.endsWith("open")) {
                const node = new Node({
                    type: token.type.replace(/^(.*?)_open$/, (_, m) => m),
                });
                current.push(node);
                stack.push(node);
            }
            else if (token.type.endsWith("close"))
                stack.pop();
        }
        if (log) {
            const out = tree.toString();
            if (file)
                fs.writeFileSync(file, out);
            else
                console.log(out);
        }
        return tree;
    }
}
class Compiler {
    input;
    constructor(input) {
        this.input = input;
    }
    tokenise(log = false, file) {
        let output = this.input.replace(RegExp(`\\\\(${Object.keys(escapes)
            .map((i) => {
            if (["*"].includes(i))
                return `\\${i}`;
            else
                return i;
        })
            .join("|")})`, "g"), (_, m) => escapes[m]);
        const tokens = [];
        const re = {
            inline: Object.fromEntries(Object.entries({
                bold: "*",
                italic: "/",
                underline: "_",
            }).map(([k, v]) => [k, genInline(v, k)])),
        };
        re["all"] = regexJoin(...Object.entries(re)
            .map(([_, v]) => {
            if (v instanceof RegExp)
                return v;
            else
                return Object.values(v);
        })
            .flat());
        while (re["all"].test(output)) {
            let best = null;
            for (const r of Object.values(re["inline"])) {
                const match = output.match(r);
                if (!match)
                    continue;
                else if (!best || match.index < best.match.index)
                    best = { regex: r, match };
            }
            const match = best.match;
            const parts = output.split(match[0]);
            const pre = parts[0];
            const type = Object.keys(best.match.groups)[0].replace(/(.*?)_text/, (_, m) => m);
            if (pre.length)
                tokens.push(new Token({ type: "text", text: pre }));
            const content = match[1];
            const contentTokens = new Compiler(content).tokenise();
            tokens.push(new Token({ type: `${type}_open` }));
            if (contentTokens.length === 1)
                tokens.push(new Token({ type: "text", text: content }));
            else
                tokens.push(...contentTokens);
            tokens.push(new Token({ type: `${type}_close` }));
            output = parts.at(-1);
        }
        tokens.push(new Token({ type: "text", text: output }));
        if (log) {
            const out = JSON.stringify(tokens
                .map((i) => {
                if (i.type === "text")
                    return i.text;
                else
                    return i.type;
            })
                .filter(Boolean), null, "\t");
            if (file)
                fs.writeFileSync(file, out);
            else
                console.log(out);
        }
        return new TokenArray(tokens);
    }
}
const tests = ["*1 /2 _3 *4 /5/ 6* 7_ 8/ 9*", "**a*Test**c*"];
for (let i = 0; i < tests.length; i++) {
    const dir = `tests/${i}`;
    fs.mkdirSync(dir, { recursive: true });
    new Compiler(tests[i])
        .tokenise(true, `${dir}/tokens.json`)
        .parse(true, `${dir}/nodes.json`)
        .render(true, `${dir}/render.html`);
}
