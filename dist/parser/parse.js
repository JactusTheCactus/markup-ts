import fs from "node:fs";
import path from "node:path";
import Node from "../renderer/Node.js";
import Tokens from "./Tokens.js";
export default (THIS, ...file) => {
    const tree = new Node({ type: "root" });
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
    if (file.length)
        fs.writeFileSync(path.join(...file), tree.toString());
    return tree;
};
