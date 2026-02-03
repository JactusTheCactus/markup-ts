set shell := ["bash", "-uoc", "pipefail"]
set quiet := true

mod clean "just/clean.just"
mod utils "just/utilities.just"

alias list := utils::list
alias fmt := utils::fmt

[default]
[doc('Build & run the project')]
all: utils::fmt && build run

[doc('Build the project')]
build: check clean::pre && clean::post
	mkdir -p dist
	tsc

check:
	tsc --noEmit

[confirm("Are you sure you want to clear `./dist/` & rebuild? [y/n]")]
[doc("Clear `./dist/` & build the project")]
reset: && build
	rm -rf dist

[doc('Run the project')]
run:
	node dist/main
