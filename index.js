"use strict";

const express     = require('express');
const bodyParser  = require('body-parser');
const fs          = require('fs');
const url         = require('url');
const exec        = require('child_process').exec;
const serveIndex  = require('serve-index');
const crypto      = require('crypto');

const app = express();

// Parse JSON into the req.body as an object
app.use(bodyParser.json());

// Mount ./files at /files for serving music and make a visible file index
app.use('/files', express.static('files'));
app.use('/files', serveIndex('./files', {'icons': true}));

// Get uself an image lel
app.get('/image', (req, res) => {
  const imageUrl = url.parse(req.query.url, true);
  getStaticCompressedImageUrl(imageUrl)
  .then((url)  => { res.redirect(url); })
  .catch((err) => { res.status(500).send({ 'error': err.message }); });
});

app.listen(3000, function () {
  console.log('ImgSmack listening on port 3000!');
});

const getStaticCompressedImageUrl = (imageUrl) => {
  const imgHash = crypto.createHash('md5').update(imageUrl.href).digest("hex");
  return new Promise((resolve, reject) => {
    fs.exists(`./files/${imgHash}.png`, (exists) => {
      if (exists) {
        resolve(`http://32a9ae58.ngrok.io/files/${imgHash}.png`);
      } else {
        compressAndCacheImage(imageUrl)
        .then((url) => { resolve(url); })
        .catch((err) => { reject(err); });
      }
    });
  });
};

const compressAndCacheImage = (imageUrl) => {
  const imgHash = crypto.createHash('md5').update(imageUrl.href).digest("hex");
  return new Promise((resolve, reject) => {
    const download = exec(`wget ${imageUrl.href} -O /tmp/${imgHash}`,
      (err) => {
        if (err !== null) { reject(err); }
        const compress = exec(`ffmpeg -i /tmp/${imgHash} -vf scale=320:-1 ./files/${imgHash}.png`,
          (err) => {
            if (err !== null) { reject(err); }
            else { resolve(`http://32a9ae58.ngrok.io/files/${imgHash}.png`); }
        });
    });
  });
};
