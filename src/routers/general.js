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

module.exports = router;