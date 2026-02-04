import Node from "./Node.js";
export default (THIS) => {
    return JSON.stringify(THIS, (_, node) => {
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
};
