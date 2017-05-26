const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DATA_ROOT = process.env.DATA_ROOT || '';
const PUBLIC_ROOT = process.env.PUBLIC_ROOT || '';

const s3 = new AWS.S3();

if (!DATA_ROOT) {
  throw Error('Error: DATA_ROOT not set. You must configure a folder where uploads will be saved.');
} else {
  const s3Enabled = DATA_ROOT.startsWith('s3://');
  console.log('Starting app with config:', {
    PORT: PORT,
    DATA_ROOT: DATA_ROOT,
    PUBLIC_ROOT: PUBLIC_ROOT,
    s3: {
      enabled: s3Enabled,
      Bucket: s3Enabled ? getS3BucketAndPrefix(DATA_ROOT)[0] : null,
      Prefix: s3Enabled ? getS3BucketAndPrefix(DATA_ROOT)[1] : null,
    },
  });
}

function getS3BucketAndPrefix(url) {
  const parts = url.match('s3://([^/]+)/?(.*)');
  const Bucket = parts[1];
  const Prefix = parts[2];
  return [Bucket, Prefix];
}

const app = express();

const publicRoot = path.resolve(__dirname, PUBLIC_ROOT);

if (PUBLIC_ROOT) {
  app.use(express.static(publicRoot));
}

app.get('/api/list', function(req, response) {
  if (DATA_ROOT.startsWith('s3://')) {
    const parts = getS3BucketAndPrefix(DATA_ROOT);
    const Bucket = parts[0];
    const Prefix = parts[1];

    const params = {
      Bucket: Bucket,
      Prefix: Prefix,
      Delimiter: '/',
      RequestPayer: 'requester',
    };
    s3.listObjectsV2(params, function(err, data) {
      if (err) {
        console.log('list error', err);
        response.status(500).json({
          error: 'Error collecting file list',
          orig: err,
          stack: err.stack,
        });
      } else {
        response.status(200).json({
          paths: data.Contents.map((item) => {
            return item.Key.replace(Prefix, '/api/get?file=');
          }),
        });
      }
    });
  } else {
    const globOptions = {cwd: DATA_ROOT};
    glob('**/*.json', globOptions, function(err, files) {
      if (err) {
        console.log('list error', err);
        response.status(500).json({
          error: 'Error collecting file list',
          orig: err,
        });
      } else {
        response.status(200).json({paths: files});
      }
    });
  }
});

app.get('/api/get', function(req, response) {
  if (DATA_ROOT.startsWith('s3://')) {
    const parts = getS3BucketAndPrefix(DATA_ROOT);
    const Bucket = parts[0];
    const Prefix = parts[1];

    const params = {
      Bucket: Bucket,
      Key: `${Prefix}${req.query.file || ''}`,
      RequestPayer: 'requester',
    };
    s3.getObject(params, function(err, data) {
      if (err) {
        console.log('get error', err);
        response.status(404).json({
          error: 'File not found',
          orig: err,
          file: req.query.file,
        });
      } else {
        response
          .status(200)
          .set('Content-Type', 'application/json')
          .send(data.Body);
      }
    });
  } else {
    try {
      const filePath = path.resolve(DATA_ROOT, req.query.file || '');
      if (filePath === DATA_ROOT) {
        response.status(404).json({
          error: 'File not found',
          file: req.query.file,
        });
      } else {
        // check that file exists

        response.status(200).sendFile(filePath);
      }
    } catch (err) {
      console.log('get error', err);
      response.status(500).json({
        error: 'Error sending file',
        orig: err,
        query: req.query,
      });
    }
  }
});

app.post(
  '/api/save',
  bodyParser.raw({
    limit: 52428800, // 50 MB
    type: 'application/json',
  }),
  function(req, response) {
    const body = req.body;

    const today = new Date();
    const now = Date.now();
    const calendar = [
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      today.getUTCHours(),
      today.getUTCMinutes(),
      today.getUTCSeconds(),
    ].join('-');

    const name = [
      req.query.user || 'anonymous',
      req.query.project || 'default',
      `${calendar}_${now}`,
      req.query.branch || 'master',
      req.query.commit || 'HEAD',
    ].join('_') + '.json';

    if (DATA_ROOT.startsWith('s3://')) {
      const parts = getS3BucketAndPrefix(DATA_ROOT);
      const Bucket = parts[0];
      const Prefix = parts[1];

      const params = {
        Bucket: Bucket,
        Key: `${Prefix}${name}`,
        Body: body,
      };
      s3.upload(params, function(err, data) {
        if (err) {
          console.log('upload error', err);
          response.status(500).json({
            error: 'Error writing file',
            orig: err,
          });
        } else {
          response.status(200).json({
            message: 'File saved as ' + name,
            data: data,
          });
        }
      });
    } else {
      fs.writeFile(path.resolve(DATA_ROOT, name), body, function(err) {
        if (err) {
          console.log('save error', err);
          response.status(500).json({
            error: 'Error writing file',
            orig: err,
          });
        } else {
          response.status(200).json({
            message: 'File saved as ' + name,
          });
        }
      });
    }
  }
);

if (PUBLIC_ROOT) {
  // All remaining requests return the React app, so it can handle routing.
  app.get('*', function(request, response) {
    response.sendFile(path.resolve(publicRoot, 'index.html'));
  });
}

app.listen(PORT, function() {
  console.log(`Listening on port ${PORT}`);
});

function makeJSONResponse(response) {
  return function(content) {
    res.set('Content-Type', 'application/json');
    (JSON.stringify(content));
  };
}

function formatListResponse(data) {
  const prefix = '/api/get';
  const queryName = 'file';

  return {
    paths: data.Content.map(function(item) {
      return prefix + '?' + queryName + '=' + item.Key;
    }),
  };
}

function formatObjectResponse(data) {
  return data.Body.toString('utf-8');
}
