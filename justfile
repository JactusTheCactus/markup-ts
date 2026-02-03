set shell := ["bash", "-uoc", "pipefail"]

TS := shell("find src -name '*.ts'")
JS := replace_regex(TS, '\bsrc/(.*?)\.ts\b', 'dist/$1.js')

[default]
[doc('Build & run the project')]
@main mode="": fmt && build run
	case "{{ mode }}" in \
		log) \
			echo "{{ TS }}"; \
			echo "{{ JS }}" \
		;; \
	esac

[doc('Format the `./justfile`')]
@fmt:
	perl -pgi -e 's|\n\s*\n+|\n|g' justfile
	just --fmt --unstable &> /dev/null
	perl -pi -e 's| {4}|\t|g' justfile

[doc('Build the project')]
@build: && clean
	mkdir -p dist
	rm -rf tests
	tsc

[confirm("Are you sure you want to clear `./dist/` & rebuild? [y/n]")]
[doc("Clear `./dist/` & build the project")]
@reset: && build
	rm -rf dist

[doc('Run the project')]
@run script="main":
	node dist/{{ script }}

[private]
@list header="" prefix="\t\u{2022} ":
	just --list \
		--list-heading "{{ header }}" \
		--list-prefix $'{{ prefix }}' \
		--list-submodules \
		--alias-style left
	just --groups

[doc("Remove empty files & directories")]
[private]
@clean:
	find . -empty -delete
