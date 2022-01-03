import { describe, expect, it } from '@jest/globals';
import { initNewContext } from '@lemon/extract/core/types';
import * as path from 'path';
import init, { main } from './index';

describe('@lemon~core~config plugin:init', () => {
    describe('index', () => {
        describe('exports init', () => {
            describe('which', () => {
                it('is truthy', async () => {
                    expect(init).toBeTruthy();
                });
                it('is named correctly', async () => {
                    expect(init.name).toBeTruthy();
                    expect(init.name).toEqual('@lemon/extract/core/plugins/init');
                });
            });
        });
        describe('exports main', () => {
            it('which is truthy', async () => {
                expect(main).toBeTruthy();
            });
            describe('which', () => {
                it('returns the expected context without a folder', async () => {
                    const lemonContext = initNewContext({ rootDir: '<nowhere>' });
                    const expectedContext = initNewContext({ rootDir: '<nowhere>' });
                    const appliedContext = await main(lemonContext);
                    expect(appliedContext).toBeTruthy();
                    expect(appliedContext).toStrictEqual(expectedContext);
                });
                it('returns the expected context with a folder', async () => {
                    const rootDir = path.resolve('./__fixtures__/basic');
                    const lemonContext = initNewContext({ rootDir });
                    const expectedContext = initNewContext({ rootDir });
                    const appliedContext = await main(lemonContext);
                    expect(appliedContext).toBeTruthy();
                    expect(appliedContext).toStrictEqual(expectedContext);
                });
                it('can find this repo :shhhhh:', async () => {
                    const rootDir = path.resolve('../');
                    const lemonContext = initNewContext({ rootDir });
                    const appliedContext = await main(lemonContext);
                    expect(appliedContext).toBeTruthy();
                    expect(appliedContext.config.projects).toContainEqual({
                        enabled: false,
                        metadata: {},
                        name: 'extract',
                        root: './extract'
                    });
                });
            });
        });
    });
});
