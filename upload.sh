#!/usr/bin/env bash

stats_file=$1
url=$2

if [[ -z $url ]]; then
  echo 'No url specified. Where should we upload to?'
  exit 1
fi

#strip single trailing slash if exists, it'll be added back.
url="${url/%\//}"

is_git_repo=$(git rev-parse --is-inside-work-tree 2> /dev/null)
if [[ $is_git_repo != 'true' ]]; then
  echo "Not in a git repo, can't tag this file. Sorry"
  exit 2
fi

commit=$(git rev-list HEAD --max-count 1)
branch=$(git rev-parse --abbrev-ref HEAD)

project_path=$(git rev-parse --show-toplevel)
project_name=$(basename $project_path)

query="user=$USER\
  &project=$project_name\
  &branch=$branch\
  &commit=$commit\
  " | tr -d ' '

echo "Uploading:"
echo "    user = $USER"
echo "    project = $project_name"
echo "    branch = $branch"
echo "    commit = $commit"

echo ""
echo "$stats_file into $url/api/save?$query"
echo ""

curl -H "Content-Type: application/json" \
  -X POST \
  -d @$stats_file $url/api/save?$query \
  -H 'Accept: text/plain'

echo ""
echo "Done"
