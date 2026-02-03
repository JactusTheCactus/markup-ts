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

_fmt justfile="justfile":
	j={{ justfile }}; \
	mkdir -p bak/just; \
	cp -u "$j" "bak/$j"; \
	perl -pgi -e 's|\n\s*\n+|\n|g' "$j"; \
	just --justfile "$j" --fmt --unstable; \
	perl -pi -e 's| {4}|\t|g' "$j"; \
	[[ -f "$j" ]] || cp "bak/${j#./}" "$j"

[doc("List all recipes (`just --list` with additional settings)")]
list: fmt
	just --list \
		--list-heading '' \
		--list-prefix $'\t' \
		--list-submodules \
		--alias-style left
