import Node from "./Node.js";
export default (THIS) => {
    function fmt(input) {
        let { type, text, children } = { ...input };
        switch (type) {
            case "root":
                return children.map(fmt);
            case "text":
                return text;
            case "bold":
            case "italic":
            case "underline":
                return {
                    [type]: children.length > 1
                        ? children.map(fmt)
                        : fmt(children[0]),
                };
        }
    }
    return JSON.stringify(fmt(THIS), null, "\t");
};
