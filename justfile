set quiet := true
set shell := ["bash", "-uoc", "pipefail"]
set ignore-comments := true

mod clean "just/clean.just"
mod utils "just/utilities.just"

alias list := utils::list
alias fmt := utils::fmt

[default]
[doc('Build & run the project')]
all: utils::fmt build run

[doc('Build the project')]
build: clean::pre && clean::post
	mkdir -p dist
	tsc --noEmit
	tsc --build
	echo "Build Complete!"

[confirm("Are you sure you want to clear `./dist/` & rebuild? [y/n]")]
[doc("Clear `./dist/` & build the project")]
reset: && all
	rm -rf dist .tsbuildinfo
	echo "`./dist/` Cleared!"

[doc('Run the project')]
run:
	node dist/index
	echo "Run Complete!"
