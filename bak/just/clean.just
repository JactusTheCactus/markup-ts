set quiet := true
set working-directory := ".."

[doc("Remove `./tests/`")]
pre:
	rm -rf tests

[doc("Remove empty files & directories")]
post:
	find . -empty -delete
