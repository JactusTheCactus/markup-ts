import fs from "node:fs";
import path from "node:path";
import escapes from "../utils/escapes.js";
import Node from "./Node.js";
import unEscapes from "./unEscapes.js";
import htmlTags from "./htmlTags.js";
export default (THIS, ...file) => {
    switch (THIS.type) {
        case "root": {
            const out = THIS.children.map((i) => i.render()).join("");
            if (file.length)
                fs.writeFileSync(path.join(...file), out);
            return out;
        }
        case "bold":
        case "italic":
        case "underline": {
            const tag = htmlTags[THIS.type];
            return `<${tag}>${THIS.children.map((i) => i.render()).join("")}</${tag}>`;
        }
        case "text":
            return THIS.text.replace(RegExp(Object.values(escapes).join("|"), "g"), (m) => unEscapes[m]);
    }
};
