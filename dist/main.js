import { lex } from "./lexer.js";
const text = [
    "!1{Hello, World!}",
    // "!1 {Hello, World!}",
    // "<-sh>{echo 'Hello, World!'}",
    // "/upper::hello, world!;",
    // ["*Bold*", "/Italic/", "_Underlined_"].map((i) => `This text is ${i}!`),
]
    .flat()
    .join("\n");
let n = 1;
switch (n) {
    case 0:
        console.log(text);
        break;
    case 1:
        console.log(lex(text));
        break;
    /*case 2:
        console.log(
            lex(text)
                .map((i) => {
                    switch (i.type) {
                        case "text":
                            return i.text;
                        case "bold_open":
                            return null;
                        case "bold_close":
                            return null;
                        case "italic_open":
                            return null;
                        case "italic_close":
                            return null;
                        case "underline_open":
                            return null;
                        case "underline_close":
                            return null;
                        case "header_open":
                            return null;
                        case "header_close":
                            return null;
                        case "code":
                            return `<${i.language}> ${i.text}`;
                    }
                })
                .filter(Boolean)
                .join("\n"),
        );
        break;*/
}
