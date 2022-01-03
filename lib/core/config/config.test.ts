import { describe, expect, it } from '@jest/globals';
import { initNewContext } from '@lemon/extract/core/types';
import { applyLemonRcToContext, getConfig } from './config';

const compareTwoContexts = (a, b) => {
    expect(JSON.stringify(a)).toStrictEqual(JSON.stringify(b));
};
describe('@lemon~core~config config', () => {
    describe('exports getConfig', () => {
        it('correctly uses supplied context', async () => {
            const lemonContext = initNewContext({ flags: { isDryRun: false, verbosity: 1 }, rootDir: '<nowhere>' });
            const expectedContext = Object.assign({}, lemonContext);
            const config = await getConfig(lemonContext);

            compareTwoContexts(config, expectedContext);
            expect(lemonContext.rootDir).toEqual('<nowhere>');
            expect(config.rootDir).toEqual('<nowhere>');
            expect(config.flags.isDryRun).toBeFalsy();
            expect(config.flags.verbosity).toEqual(1);
        });
    });
    describe('exports applyLemonRcToContext', () => {
        it('does not unexpectedly mutate context', () => {
            const lemonContext = initNewContext({});
            const appliedContext = applyLemonRcToContext(lemonContext, {});

            expect(JSON.stringify(appliedContext)).toStrictEqual(JSON.stringify(lemonContext));
        });
        it('correctly applies lemonrc to context', () => {
            const lemonContext = initNewContext({});
            const appliedContext = applyLemonRcToContext(lemonContext, {});

            expect(appliedContext).toEqual(lemonContext);
        });
    });
});
