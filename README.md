# Webpack Stats Server

A quick little server to host some static files, and do some simple artifact management with get/post/list commands.

# Installing

You can install the server by cloning the repo:

```
git clone https://github.com/ryan953/webpack-stats-server.git
```

and then by installing dependencies and running it:

```
npm install && npm start
```

by default it will start on port 5000.

# Configuration

There are some env variables that are good to set, otherwise you'll be serving strange things.

`PORT` the port to run the webserver on
`PUBLIC_ROOT` statically serve files in this this folder
`DATA_ROOT` sets the location where API uploads will be saved. If this path starts with `s3://` Amazon S3 will be used.

You might want to check this out next to your static html website, and then run it like this:

```
# Server running on port 8080, my website checked out next to the server repo

git clone git@example.com/my-website
git clone https://github.com/ryan953/webpack-stats-server.git server
PORT=8080 PUBLIC_ROOT=../my-website node server/index.js
```

# Uploading

## Exec with something like `bash <(curl -s https://raw.githubusercontent.com/ryan953/webpack-stats-server/master/upload.sh)`
## or this? curl -s https://raw.githubusercontent.com/ryan953/webpack-stats-server/master/upload.sh | bash -s stats.json http://webpack.pinadmin.com/
