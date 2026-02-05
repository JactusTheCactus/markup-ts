set shell := ["bash", "-uoc", "pipefail"]
set quiet := true
set working-directory := ".."

[doc('Format all justfiles (`./justfile`, `./just/**/*.just`)')]
fmt:
	find . "(" \
		-wholename "./justfile" -o \
		-path "./just/*.just" \
	")" -exec \
		just utils::_fmt {} \
	";" 2> /dev/null
	echo "Format Complete!"

_fmt justfile="justfile":
	just --justfile {{ justfile }} --fmt --unstable
	perl -pi -e 's| {4}|\t|g' {{ justfile }}

[doc("List all recipes (`just --list` with additional settings)")]
list: fmt
	just --list \
		--list-heading '' \
		--list-prefix $'\t' \
		--list-submodules \
		--alias-style left
