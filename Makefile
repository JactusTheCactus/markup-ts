.PHONY : all reset
.SILENT :
SHELL := bash
TS := $(wildcard src/*.ts)
JS := $(patsubst src/%.ts,dist/%.js,$(TS))
all : $(JS)
reset :
	rm -rf dist
	$(MAKE) all
dist :
	mkdir $@
$(JS) : $(TS) | dist
	tsc
