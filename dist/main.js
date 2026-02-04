import fs from "fs";
import path from "path";
const htmlTags = {
    bold: "b",
    italic: "i",
    underline: "u",
};
function regexJoin(regexes) {
    return new RegExp(regexes.map((r) => r.source).join("|"), [...new Set(regexes.flatMap((r) => [...r.flags]))]
        .filter((i) => !["g", "y"].includes(i))
        .sort()
        .join(""));
}
const escapes = Object.entries({
    "*": "star",
    "/": "slash",
    _: "underscore",
}).reduce((acc, [k, v]) => {
    acc[k] = `\0${v.toUpperCase()}\0`;
    return acc;
}, {});
function genInline(symbol, label) {
    let newSymbol = symbol;
    if (["*"].includes(symbol))
        newSymbol = `\\${symbol}`;
    return new RegExp(newSymbol + `(?!\\s)(?<${label}_text>[^\\n]+)(?<!\\s)` + newSymbol);
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
                    return {
                        [node.type]: node.children.length > 1
                            ? node.children
                            : node.children[0],
                    };
            }
        }, "\t");
    }
    render(...file) {
        switch (this.type) {
            case "root": {
                const out = this.children.map((i) => i.render()).join("");
                if (file.length)
                    fs.writeFileSync(path.join(...file), out);
                return out;
            }
            case "bold":
            case "italic":
            case "underline": {
                const tag = htmlTags[this.type];
                return `<${tag}>${this.children.map((i) => i.render()).join("")}</${tag}>`;
            }
            case "text":
                return this.text.replace(RegExp(Object.values(escapes).join("|"), "g"), (m) => unEscapes[m]);
        }
    }
}
class Tokens {
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
        const tree = new Node({ type: "root" });
        const stack = [tree];
        for (const token of this) {
            const current = stack.at(-1);
            if (token.type === "text")
                current.push(new Node({ text: token.text }));
            else if (token.type === "open") {
                const node = new Node({
                    type: token.inline.replace(/^(.*?)_open$/, (_, m) => m),
                });
                current.push(node);
                stack.push(node);
            }
            else if (token.type === "close") {
                if (stack.length === 1)
                    throw new Error(`Unexpected Closing tag: <${token.type}>`);
                stack.pop();
            }
        }
        if (file.length)
            fs.writeFileSync(path.join(...file), tree.toString());
        return tree;
    }
}
const symbols = {
    bold: "*",
    italic: "/",
    underline: "_",
};
const re = {
    inline: Object.fromEntries(Object.entries(symbols).map(([k, v]) => [
        k,
        genInline(v, k),
    ])),
};
class Compiler {
    input;
    constructor(input) {
        this.input = input;
    }
    /** @todo Use escaped text tokens instead of `this.input.replace(...)` */
    tokenise(...file) {
        let re_escape_arr = Object.keys(escapes).map((i) => {
            if (["*"].includes(i))
                return `\\${i}`;
            else
                return i;
        });
        const re_escape = RegExp(`\\\\(${re_escape_arr.join("|")})`);
        let output = this.input.replace(RegExp(re_escape, "g"), (_, m) => escapes[m]);
        const tokens = [];
        const all = regexJoin(Object.entries(re)
            .map(([_, v]) => {
            if (v instanceof RegExp)
                return v;
            else
                return Object.values(v);
        })
            .flat());
        while (all.test(output)) {
            let best = null;
            for (const r of Object.values(re["inline"])) {
                const match = output.match(r);
                if (!match)
                    continue;
                else if (!best || match.index < best.match.index)
                    best = { regex: r, match };
            }
            const match = best.match;
            const start = match.index;
            const end = start + match[0].length;
            const before = output.slice(0, start);
            const after = output.slice(end);
            const type = Object.keys(best.match.groups)[0].replace(/(.*?)_text/, (_, m) => m);
            if (before.length)
                tokens.push({ type: "text", text: before });
            const content = match[1];
            const contentTokens = new Compiler(content).tokenise();
            tokens.push({ inline: type, type: "open" });
            /*if (contentTokens.length === 1)
                tokens.push({ type: "text", text: content });
            else tokens.push(...contentTokens);*/
            tokens.push(...contentTokens);
            tokens.push({ inline: type, type: "close" });
            output = after;
        }
        tokens.push({ type: "text", text: output });
        if (file.length)
            fs.writeFileSync(path.join(...file), JSON.stringify(tokens
                .map((i) => {
                if (i.type === "text")
                    return i.text;
                else
                    return `[${i.inline}_${i.type}]`;
            })
                .filter(Boolean), null, "\t"));
        return new Tokens(tokens);
    }
}
const tests = [
    ["*Bold*", "Not \\*Bold\\*"],
    ["*1 /2 _3_ 4/ 5*", "/1 _2 *3* 4_ 5/", "_1 *2 /3/ 4* 5_"],
    "**a*Test**c*",
    "*bold /italic* text/",
].map((i) => {
    if (typeof i === "object")
        return i.map((n) => n.trim()).join("\n");
    else
        return i.trim();
});
tests.forEach((test, index) => {
    const dir = path.join("tests", String(index));
    fs.mkdirSync(dir, { recursive: true });
    new Compiler(test)
        .tokenise(dir, "1-tokens.json")
        .parse(dir, "2-nodes.json")
        .render(dir, "3-render.html");
});
