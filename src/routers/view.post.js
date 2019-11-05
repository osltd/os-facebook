/**
 *  ------------- Load dependencies -------------
 */
const express           = require('express');
const router            = express.Router();
const request           = require('request');
const h2p               = require('html2plaintext');
const requestImageSize  = require('request-image-size');
const config            = require('../constants/config');
const fs                = require('fs');



/**
 *      --------- Render article page ---------
 */
// get the home page
router.get('/articles/:article_id', (req, res) => {
    // set data container
    var article = {};
    // fetch articles
    new Promise((resolve, reject) => request({
        url    : config.OS.ENDPOINT + '/articles?ids=' + req.params.article_id,
        method : 'GET',
        auth   : {
            'user' : config.OS.ID,
            'pass' : config.OS.KEY
        }
    }, (error, resp, body) => {
        let result = null;
        try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
        // get article
        article = ((result.data || {}).rows || []).shift() || {};
        // next process
        resolve();
    }))
    // get thumbnail data
    .then(() => new Promise((resolve, reject) => {
        // get thumbnail
        const thumb = ((((article || {}).sections || []).shift() || {}).media || []).filter(m => /^(jpe?g|png|svg|git|bmp)$/i.test(m.ext))[0] || null;
        if (!thumb) {
            resolve();
        } else {
            // download image
            requestImageSize(thumb.url)
            // failed
            .catch(err => resolve({}))
            // downloaded
            .then(size => {
                // next process
                resolve({
                    info : size,
                    src  : thumb.url
                });
            });
        }
    }))
    // load html source
    .then(thumb => fs.readFile(`${__dirname}/../helpers/reader/build/index.html`, (err, data) => {
        // get html
        let html = data.toString();
        // replacements
        let replacements = {
            article : JSON.stringify(article) || "{}",
            title   : (((article || {}).sections || []).shift() || {}).title || 'Error: 404',
            url     : `http://${req.hostname}/articles/${req.params.article_id}`,
            desc    : (((article || {}).sections || []).shift() || {}).description || ' ',
            thumb   : thumb ? [
                `<meta name="thumbnail" content="${thumb.src}"/>`,
                `<meta property="og:image:width" content="${thumb.info.width}"/>`,
                `<meta property="og:image:height" content="${thumb.info.height}"/>`
            ].join('') : ''
        };
        // inject data
        Object.keys(replacements).forEach(field => html = html.replace(`{{__${field.toUpperCase()}__}}`, replacements[field]));
        // set header
        res.setHeader('content-type', 'text/html');
        // output
        res.status(200).end(html);
    }))
    // any error?
    .catch(error => res.status(500).json({
        result  : false,
        message : error
    }));
});


// load assets of the file
router.get('/static/:filePath([a-zA-Z0-9\.\/]+)', (req, res) => fs.readFile(`${__dirname}/../helpers/reader/build/static/${req.params.filePath}`, (err, data) => {
    let contentType = {
        js  : 'text/javascript',
        css : 'text/css',
        png : 'image/png',
        jpg : 'image/jpg',
        svg : 'image/svg+xml',
        ico : 'image/x-icon',
        mp4 : 'video/mp4',
        qt  : 'video/qt'
    }
    // set header
    res.setHeader('content-type', contentType[req.params.filePath.split('.').pop()] || 'text/*');
    // output
    res.status(err ? 404 : 200).end(err ? `File not found.` : data.toString());
}))


module.exports = router;