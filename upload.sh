#!/usr/bin/env bash

stats_file=$1
#strip single trailing slash if exists on url, it'll be added back.
host="${2/%\//}"
desc=$3

function main() {
  if [[ -z $host ]]; then
    echo 'No host specified. Where should we upload to?'
    exit 1
  fi

  is_git_repo=$(git rev-parse --is-inside-work-tree 2> /dev/null)
  if [[ $is_git_repo == 'true' ]]; then
    upload_from_git_repo
  elif [[ "x$desc" != "x" ]]; then
    # fall back to uploading with a description, but don't echo help for this, it's jank
    upload_with_description
  else
    echo "Not in a git repo, can't tag this file. Sorry"
    exit 2
  fi
}

function do_upload () {
  local query="$1"
  local url="$host/api/save?$query"

  echo ""
  echo "$stats_file into $url"
  echo ""

  curl -H "Content-Type: application/json" \
    -X POST \
    -d @$stats_file $url \
    -H 'Accept: text/plain'

  echo ""
  echo "Done"
}

function upload_from_git_repo () {
  commit=$(git rev-list HEAD --max-count 1)
  branch=$(git rev-parse --abbrev-ref HEAD)

  project_path=$(git rev-parse --show-toplevel)
  project_name=$(basename $project_path)

  query="user=$USER\
    &project=$project_name\
    &branch=$branch\
    &commit=$commit\
    &tag=$desc\
    " | tr -d ' '

  echo "Uploading:"
  echo "    user = $USER"
  echo "    project = $project_name"
  echo "    branch = $branch"
  echo "    commit = $commit"
  echo "    tag = $desc"

  do_upload $query
}

function upload_with_description() {
  query="user=$USER\
    &desc=$desc\
    " | tr -d ' '

  echo "Uploading:"
  echo "    user = $USER"
  echo "    description = $desc"

  do_upload $query
}

main

