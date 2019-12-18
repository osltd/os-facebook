/**
 *  ------------- Load dependencies -------------
 */
const express = require('express');
const router  = express.Router();
const fs                = require('fs');

// set healthcheck route
router.get('/healthcheck', (req, res) => res.status(200).json({
    result   : true,
    messages : [`no problemo.`]
}));

// ---------- Home Page ----------
router.get('/', (req, res) => fs.readFile(`${__dirname}/../assets/index.html`, (err, data) => {
    // set mime type
    res.set('content-type', 'text/html');
    res.status(200).end(data.toString());
}))


// ---------- Privacy policy ----------
router.get('/privacy_policy', (req, res) => fs.readFile(`${__dirname}/../assets/privacy_policy.html`, (err, data) => {
    // set mime type
    res.set('content-type', 'text/html');
    res.status(200).end(data.toString());
}));

module.exports = router;