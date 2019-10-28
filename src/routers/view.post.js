/**
 *  ------------- Load dependencies -------------
 */
const express           = require('express');
const router            = express.Router();
const request           = require('request');
const h2p               = require('html2plaintext');
const requestImageSize  = require('request-image-size');
const config            = require('../constants/config');





/**
 *      --------- Render article page ---------
 */
router.get('/articles/:articleId', function(req, res) {
    request({
        url: config.OS.ENDPOINT + '/articles?ids=' + req.params.articleId,
        method: 'GET',
        auth: {
            'user': config.OS.ID,
            'pass': config.OS.KEY
        }
    }, (error, resp, body) => {
        let result = null, page = null;
        try {result = JSON.parse(body)} catch(e) {result = null} finally {result = result || {}}
        const article = ((result.data || {}).posts || []).shift() || {};
        if (!article.id) {
            res.statusCode = 404;
            res.end('Page not found.');
        } else {
            const sections = article.sections || [];
            new Promise((resolve, reject) => {
                const thumb = ((sections[0] || {}).medias || []).filter(m => /^(jpe?g|png|svg|git|bmp)$/i.test(m.ext))[0] || null;
                if (!thumb) {
                    resolve({});
                } else {
                    // download image
                    requestImageSize(thumb.url)
                    // failed
                    .catch(err => resolve({}))
                    // downloaded
                    .then(size => {
                        // next process
                        resolve({
                            info: size,
                            src: thumb.url
                        });
                    });
                }
            })
            .then(thumb => {
                const title = (sections[0] || {}).title || 'Untitled';
                const desc = h2p((sections[0] || {}).description || '');

                res.set('Content-Type', 'text/html');
                res.end(Buffer.from('<html>'
                    + '<head>'

                        + '<meta charset="utf-8"/>'
                        + `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>`

                        + `<title>${title}</title>`

                        + `<meta property="og:title" content="${title}"/>`
                        + `<meta property="og:url" content="https://${req.hostname}${req.originalUrl}"/>`
                        + (desc.length > 0 ? `<meta property="og:description" content="${desc}"/>` : '')
                        + (thumb ? [
                            `<meta name="thumbnail" content="${thumb.src}"/>`,
                            `<meta property="og:image:width" content="${thumb.info.width}"/>`,
                            `<meta property="og:image:height" content="${thumb.info.height}"/>`
                        ].join('') : '')

                    + '</head>'
                    + '<body style="margin: 0; padding: 0; height: 100%;">' +



                        sections.map((section, i) => '<section style="' + (i ? 'margin-top: 80px;' : '') + '">' +

                            (i && (section.title || '').length > 0 ? '<h1 style="color: #1c2d5b; margin: 5px 15px 20px;">' + section.title + '</h1>' : '') +
                            ((section.medias || []).length > 0 ? '<div>' +
                                '<div class="context">' +
                                    '<ul style="list-style: none; padding: 0; margin: 0;">' +
                                        section.medias.map(media => '<li>' +
                                            '<img src="' + media.url + '" width="100%"/>' +
                                        '</li>').join('') +
                                    '</ul>' +
                                '</div>' +
                            '</div>' : '') +

                            (!i && (section.title || '').length > 0 ? '<h1 style="color: #1c2d5b; margin: 5px 15px 20px;">' + section.title + '</h1>' : '') +
                            ((section.description || '').length > 0 ? '<div style="white-space: pre-line; color: #45547d; font-size: 16px; margin: ' + (i ? '10px 15px 0' : '0 15px') + ';">' + h2p(section.description) + '</div>' : '') +
                        
                        '</section>').join('')



                        + '<br/><br/><br/>'
                    + '</body>'
                + '</html>'));

            });
        }

    });
});

module.exports = router;