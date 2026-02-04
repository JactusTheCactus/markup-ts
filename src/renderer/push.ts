import Node from "./Node.js";
export default (THIS: Node, ...children: Node[]): void => {
	for (const child of children)
		if (
			child?.type !== "text" ||
			child?.text?.length > 0 ||
			child?.children.length > 0
		)
			THIS.children.push(child);
};
