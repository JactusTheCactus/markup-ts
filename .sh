#!/usr/bin/env bash
set -uo pipefail
flag() {
	for f in "$@"
		do [[ -e ".flags/$f" ]] || return 1
	done
}
flag local || npm ci
clear
if make "$@"
	then node dist/main
fi
tree -F --noreport tests
