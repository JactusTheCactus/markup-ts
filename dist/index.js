import fs from "node:fs";
import path from "node:path";
import Markup from "./tokeniser/Markup.js";
[
    ["*Bold*", "Not \\*Bold\\*"],
    ["*1 /2 _3_ 4/ 5*", "/1 _2 *3* 4_ 5/", "_1 *2 /3/ 4* 5_"],
    "**a*Test**c*",
    "*bold /italic* text/",
].forEach((test, index) => {
    const dir = path.join("tests", String(index));
    fs.mkdirSync(dir, { recursive: true });
    new Markup(typeof test === "object"
        ? test.map((n) => n.trim()).join("\n")
        : test.trim())
        .tokenise(dir, "1-tokens.json")
        .parse(dir, "2-nodes.json")
        .render(dir, "3-render.html");
});
