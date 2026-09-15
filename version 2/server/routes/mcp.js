const express = require('express');
const { mcpHttpHandler } = require('../mcp/protocol');

const router = express.Router();

router.get('/', mcpHttpHandler);
router.post('/', mcpHttpHandler);

module.exports = router;
