import Node from "./Node.js";
export default (THIS: Node): string => {
	return JSON.stringify(
		THIS,
		(
			_: string,
			node: Node,
		): string | Node | Node[] | Record<string, Node | Node[]> => {
			switch (node?.type) {
				case "root":
					return node.children;
				case "text":
					return node.text;
				case "bold":
				case "italic":
				case "underline":
					return {
						[node.type]:
							node.children.length > 1
								? node.children
								: node.children[0],
					};
			}
		},
		"\t",
	);
};
