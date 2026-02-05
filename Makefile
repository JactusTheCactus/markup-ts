.PHONY: default reset run
.SILENT:
SHELL := /usr/bin/bash
JUST_STATE := . -type f "(" -path "./just/*" -name "*.just" -o -name justfile ")"
DIST_STATE := src -type f -name "*.ts"
default: just/.state dist/.state run
just/.state: $(sort $(shell find $(JUST_STATE)))
	just fmt
	./get-state "$@" $(JUST_STATE)
dist/.state: $(sort $(shell find $(DIST_STATE)))
	just build
	./get-state "$@" $(DIST_STATE)
run:
	source ~/.nvm/nvm.sh && \
	nvm use 24 > /dev/null && \
	just run
reset:
	just reset
