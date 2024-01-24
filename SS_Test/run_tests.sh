#!/bin/bash

docker compose up --build --abort-on-container-exit --exit-code-from tester
echo

if [[ $? -ne 0 ]]; then
	echo "Testing failed."
else
	echo "Testing succeeded."
fi

