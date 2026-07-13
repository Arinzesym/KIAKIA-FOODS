import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMissingOrdersColumn,
  getMissingTableColumn,
  isMissingTableError,
  resolveOptionalTableResult,
  toUuidOrNull
} from '../omsCompatibility';

test('toUuidOrNull returns UUID and rejects non-UUID values', () => {
  assert.equal(toUuidOrNull('d290f1ee-6c54-4b01-90e6-d701748f0851'), 'd290f1ee-6c54-4b01-90e6-d701748f0851');
  assert.equal(toUuidOrNull('not-a-uuid'), null);
  assert.equal(toUuidOrNull(undefined), null);
});

test('missing column parsers read PostgREST and schema cache messages', () => {
  assert.equal(
    getMissingOrdersColumn({ message: "column orders.delivery_margin does not exist" }),
    'delivery_margin'
  );
  assert.equal(
    getMissingOrdersColumn({ message: "Could not find the 'runner_incentive' column of 'orders' in the schema cache" }),
    'runner_incentive'
  );
  assert.equal(
    getMissingTableColumn({ message: "column rider_assignments.proof_url does not exist" }, 'rider_assignments'),
    'proof_url'
  );
});

test('resolveOptionalTableResult swallows missing table but throws other errors', () => {
  const missingTable = resolveOptionalTableResult(
    {
      data: null,
      error: { message: "Could not find the table 'public.dispatches' in the schema cache" }
    },
    'dispatches'
  );

  assert.deepEqual(missingTable, []);
  assert.equal(
    isMissingTableError({ message: 'relation "public.dispatches" does not exist' }, 'dispatches'),
    true
  );

  assert.throws(
    () => resolveOptionalTableResult({ data: null, error: { message: 'permission denied' } }, 'dispatches'),
    /permission denied/i
  );
});
