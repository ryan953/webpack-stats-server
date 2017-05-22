#!/usr/bin/env bash

if [[ -z $url ]]; then
  echo 'No url specified. Where should we upload to?'
fi

# user
commit=$(git rev-list HEAD --max-count 1)
branch=$(git rev-parse --abbrev-ref HEAD)

project_path=$(git rev-parse --show-toplevel)
project_name=$(basename $project_path)

query="user=$USER\
  &project=$project_name\
  &branch=$branch\
  &commit=$commit\
  " | tr -d ' '

curl -H "Content-Type: application/json" \
  -X POST \
  -d @stats-example.json $url/api/save?$query \
  -H 'Accept: text/plain'
