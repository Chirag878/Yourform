import test from 'node:test';
import assert from 'node:assert/strict';
import { TRPCError } from '@trpc/server';
import { FormsServiceError } from '@repo/services/forms/errors';
import { handleServiceError } from './shared';

test('handleServiceError maps service code to TRPCError', () => {
  try {
    handleServiceError(new FormsServiceError('Denied', 'FORBIDDEN'));
    assert.fail('expected throw');
  } catch (error) {
    assert.ok(error instanceof TRPCError);
    assert.equal(error.code, 'FORBIDDEN');
    assert.equal(error.message, 'Denied');
  }
});
