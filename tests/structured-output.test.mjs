import assert from 'node:assert/strict';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('PCP read tools advertise versioned structured output', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['dist/server.js'],
    stderr: 'pipe',
  });
  const client = new Client({ name: 'structured-output-test', version: '1.0.0' });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();

    for (const name of ['dump_database', 'get_forecast_tasks']) {
      const tool = tools.find(candidate => candidate.name === name);
      assert.ok(tool, `${name} must be registered`);
      assert.equal(tool.outputSchema?.type, 'object');
      assert.deepEqual(tool.outputSchema?.properties?.schemaVersion, {
        type: 'string',
        const: '1.0',
      });
    }
  } finally {
    await client.close();
  }
});
