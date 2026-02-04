set quiet := true
set shell := ["bash", "-uoc", "pipefail"]
set ignore-comments := true

mod clean "just/clean.just"
mod utils "just/utilities.just"

alias list := utils::list
alias fmt := utils::fmt

[default]
[doc('Build & run the project')]
all:
	make

[doc('Build the project')]
build: clean::pre && clean::post
	mkdir -p dist
	tsc --noEmit
	tsc --build

[confirm("Are you sure you want to clear `./dist/` & rebuild? [y/n]")]
[doc("Clear `./dist/` & build the project")]
reset: && build
	rm -rf dist

[doc('Run the project')]
run:
	node dist/index
