.PHONY: default fmt reset run
.SILENT:
SHELL := /usr/bin/bash
TS := $(shell find src -name "*.ts")
JS := $(patsubst src/%.ts,dist/%.js,$(TS))
default: fmt dist run
fmt:
	just fmt
dist: src
	just build
run:
	source ~/.nvm/nvm.sh && \
	nvm use 24 > /dev/null && \
	just run
reset:
	just reset
