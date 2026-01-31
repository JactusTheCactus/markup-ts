export function parse(tokens) {
    const root = [];
    const stack = [];
    function pushNode(node) {
        const parent = stack.at(-1);
        if (parent?.children)
            parent.children.push(node);
        else
            root.push(node);
    }
    for (const token of tokens) {
        switch (token.type) {
            case "text": {
                pushNode({ type: "text", value: token.text });
                break;
            }
            case "bold_open": {
                const node = { type: "bold", children: [] };
                pushNode(node);
                stack.push(node);
                break;
            }
            case "bold_close":
                if (stack.at(-1)?.type !== "bold")
                    throw new Error("Unmatched *");
                stack.pop();
                break;
            case "italic_open": {
                const node = { type: "italic", children: [] };
                pushNode(node);
                stack.push(node);
                break;
            }
            case "italic_close": {
                if (stack.at(-1)?.type !== "italic")
                    throw new Error("Unmatched /");
                stack.pop();
                break;
            }
            case "underline_open": {
                const node = { type: "underline", children: [] };
                pushNode(node);
                stack.push(node);
                break;
            }
            case "underline_close": {
                if (stack.at(-1)?.type !== "underline")
                    throw new Error("Unmatched _");
                stack.pop();
                break;
            }
        }
    }
    if (stack.length)
        throw new Error("Unclosed formatting tag");
    return root;
}
