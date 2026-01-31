import { regexJoin } from "./utils.js";
export function lex(i) {
    const tokens = [];
    function pushText(text) {
        tokens.push({ type: "text", text });
        i = i.replace(text, "");
    }
    function pushOpenClose(text, type, lvl) {
        if (type == "header") {
            tokens.push({ type: "header_open", level: lvl });
            pushText(text);
            tokens.push({ type: "header_close", level: lvl });
        }
        else {
            tokens.push({ type: `${type}_open` });
            pushText(text);
            tokens.push({ type: `${type}_close` });
        }
    }
    const re = {
        code: /<-(?<escape>!?)(?<language>\w+)>\{(?<text>[\s\S]*?)\}/,
        inline: {
            bold: /\*(?!\s)(?<text>[^*\n]+?)(?<!\s)\*/,
            italic: /\/(?!\s)(?<text>[^\/\n]+?)(?<!\s)\//,
            underline: /_(?!\s)(?<text>[^_\n]+?)(?<!\s)_/,
        },
        header: /^!(?<level>[1-6])\{(?<text>[^\n]*?)\}$/m,
        command: /\/(?<cmd>(?:upp|low)er|cap)(?<arguments>(?:::.+?)+?);/,
    };
    re["all"] = regexJoin(...Object.values(re)
        .map((x) => {
        if (x instanceof RegExp) {
            return x;
        }
        else {
            return Object.values(x);
        }
    })
        .flat());
    let text = "";
    const inline = Object.keys(re["inline"]);
    while (re["all"].test(i)) {
        if (re["code"].test(i)) {
            text = i.match(re["code"]).groups["text"];
            tokens.push({
                type: "code",
                text: i.match(re["code"]).groups["text"],
                language: i.match(re["code"]).groups["language"],
            });
            pushText(i.slice(0, i.indexOf(text)));
        }
        else if (re["header"].test(i)) {
            text = i.match(re["header"]).groups["text"];
            pushText(i.slice(0, i.indexOf(text)));
            pushOpenClose(text, "header", parseInt(i.match(re["header"]).groups["level"]));
            pushText(i.slice(0, i.indexOf(text)));
        }
        else if (regexJoin(...inline.map((i) => re["inline"][i])).test(i)) {
            inline.forEach((k) => {
                text = i.match(re["inline"][k]).groups["text"];
                pushText(i.slice(0, i.indexOf(text)));
                pushOpenClose(text, k);
            });
        }
        continue;
    }
    return tokens;
}
