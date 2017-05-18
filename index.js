const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DATA_ROOT = process.env.DATA_ROOT || '';
const PUBLIC_ROOT = process.env.PUBLIC_ROOT || '';

if (!DATA_ROOT) {
  throw Error('Error: DATA_ROOT not set. You must configure a folder where uploads will be saved.');
} else {
  console.log('Starting app with config:', {
    PORT: PORT,
    DATA_ROOT: DATA_ROOT,
    PUBLIC_ROOT: PUBLIC_ROOT,
  });
}

const app = express();

const publicRoot = path.resolve(__dirname, PUBLIC_ROOT);

if (PUBLIC_ROOT) {
  app.use(express.static(publicRoot));
}

app.get('/api/list', function(req, response) {
  const globOptions = {cwd: DATA_ROOT};
  glob('**/*.json', globOptions, function(err, files) {
    if (err) {
      response.stats(500).json({
        error: 'Error collecting file list',
        orig: err,
      });
    } else {
      response.status(200).json({paths: files});
    }
  });
});

app.get('/api/get', function(req, response) {
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
    response.status(500).json({
      error: 'Error sending file',
      orig: err,
      query: req.query,
    });
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
    const name = 'upload-' + Date.now() + '.json';
    fs.writeFile(path.resolve(DATA_ROOT, name), body, function(err) {
      if (err) {
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
});

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
