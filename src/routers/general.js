/**
 *  ------------- Load dependencies -------------
 */
const express = require('express');
const router  = express.Router();

// set healthcheck route
router.get('/healthcheck', (req, res) => res.status(200).json({
    result   : true,
    messages : [`no problemo.`]
}));

// TMP
router.get('/configs', (req, res) => res.status(200).json(process.env));

module.exports = router;