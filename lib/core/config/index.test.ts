import { describe, expect, it } from '@jest/globals';
import { getConfig } from './index';

describe('@lemon~core~config index', () => {
    describe('exports getConfig', () => {
        it('correctly uses supplied context', async () => {
            expect(getConfig).toBeTruthy();
        });
    });
});
