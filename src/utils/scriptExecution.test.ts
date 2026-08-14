import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import { buildOmniFocusParameterInjection } from './scriptExecution.js';

test('forecast arguments are available inside injected OmniJS', () => {
  const injection = buildOmniFocusParameterInjection({
    days: 14,
    hideCompleted: false,
    includeDeferredOnly: true,
  });

  const values = vm.runInNewContext(
    `${injection}\n({ days, hideCompleted, includeDeferredOnly })`,
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(values)),
    { days: 14, hideCompleted: false, includeDeferredOnly: true },
  );
});

test('forecast arguments retain deployed defaults', () => {
  const injection = buildOmniFocusParameterInjection({});
  const values = vm.runInNewContext(
    `${injection}\n({ days, hideCompleted, includeDeferredOnly })`,
  );

  assert.deepEqual(
    JSON.parse(JSON.stringify(values)),
    { days: 7, hideCompleted: true, includeDeferredOnly: false },
  );
});
