const { callTool, getToolDefinitions } = require('./tools');

function jsonRpcResult(id, result) {
    return {
        jsonrpc: '2.0',
        id,
        result
    };
}

function jsonRpcError(id, code, message, data) {
    return {
        jsonrpc: '2.0',
        id: id === undefined ? null : id,
        error: {
            code,
            message,
            ...(data ? { data } : {})
        }
    };
}

async function handleMcpMessage(message) {
    const { id, method, params = {} } = message || {};

    if (!method) {
        return jsonRpcError(id, -32600, 'Invalid JSON-RPC request: method is required.');
    }

    if (method === 'initialize') {
        return jsonRpcResult(id, {
            protocolVersion: '2025-03-26',
            capabilities: {
                tools: {}
            },
            serverInfo: {
                name: 'enterprise-dbms-mcp',
                version: '1.0.0'
            }
        });
    }

    if (method === 'notifications/initialized') {
        return null;
    }

    if (method === 'ping') {
        return jsonRpcResult(id, {});
    }

    if (method === 'tools/list') {
        return jsonRpcResult(id, {
            tools: getToolDefinitions()
        });
    }

    if (method === 'tools/call') {
        if (!params.name) {
            return jsonRpcError(id, -32602, 'Tool name is required.');
        }

        try {
            const result = await callTool(params.name, params.arguments || {});
            return jsonRpcResult(id, result);
        } catch (err) {
            return jsonRpcError(id, -32000, err.message);
        }
    }

    return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

async function mcpHttpHandler(req, res) {
    if (req.method === 'GET') {
        return res.json({
            name: 'enterprise-dbms-mcp',
            transport: 'streamable-http',
            endpoint: '/api/mcp',
            tools: getToolDefinitions().map(tool => tool.name)
        });
    }

    if (req.method !== 'POST') {
        res.set('Allow', 'GET, POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body;
    const messages = Array.isArray(body) ? body : [body];
    const responses = [];

    for (const message of messages) {
        const response = await handleMcpMessage(message);
        if (response) responses.push(response);
    }

    if (Array.isArray(body)) {
        return res.json(responses);
    }

    if (responses.length === 0) {
        return res.status(202).end();
    }

    return res.json(responses[0]);
}

module.exports = {
    handleMcpMessage,
    mcpHttpHandler
};
