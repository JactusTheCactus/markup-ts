import { escapeHtml } from "./utils.js";
import type { Node } from "./ast.js";
export function toHTML(nodes: Node[]): string {
	return nodes.map(render).join("");
}
function render(node: Node): string {
	switch (node.type) {
		case "text":
			return escapeHtml(node.value);
		case "bold":
			return $("b").append(toHTML(node.children!)).toString();
		case "italic":
			return $("i").append(toHTML(node.children!)).toString();
		case "underline":
			return $("u").append(toHTML(node.children!)).toString();
		case "header":
			return $(`h${node.level}`)
				.append(toHTML(node.children!))
				.toString();
		case "code":
			let content = node.raw;
			return $(`pre code.lang-${node.language}`)
				.append(content)
				.toString();
	}
}
