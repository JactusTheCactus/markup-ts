.PHONY : default fmt run
.SILENT :
.ONESHELL :
SHELL := /usr/bin/bash
TS := $(shell find src -name "*.ts")
JS := $(patsubst src/%.ts,dist/%.js,$(TS))
default : fmt $(JS) run
fmt :
	just fmt
$(JS) : $(TS)
	just build
run :
	source ~/.nvm/nvm.sh
	nvm use 24 > /dev/null
	just run
