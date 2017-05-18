#!/usr/bin/env bash

curl -H "Content-Type: application/json" \
  -X POST \
  -d @stats-example.json http://localhost:5000/api/save
