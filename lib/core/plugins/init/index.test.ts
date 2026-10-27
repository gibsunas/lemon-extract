import { describe, expect, it } from '@jest/globals';
import { initNewContext } from '@lemon/extract/core/types';
import * as path from 'path';
import init, { main } from './index';

// The context carries a `debug` function, and two contexts never share the same
// function identity. Compare the serializable shape instead.
const serialized = (value: unknown) => JSON.stringify(value);

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
                    expect(serialized(appliedContext)).toEqual(serialized(expectedContext));
                });
                it('returns the expected context with a folder', async () => {
                    const rootDir = path.resolve('./lib/core/plugins/init/__fixtures__/basic');
                    const lemonContext = initNewContext({ rootDir });
                    const expectedContext = initNewContext({ rootDir });
                    const appliedContext = await main(lemonContext);
                    expect(appliedContext).toBeTruthy();
                    expect(serialized(appliedContext)).toEqual(serialized(expectedContext));
                });
            });
        });
        describe('exports bootstrap', () => {
            it('discovers projects from the root directory', async () => {
                const rootDir = path.resolve('./lib/core/plugins/init/__fixtures__/basic');
                const lemonContext = await init.bootstrap(initNewContext({ rootDir })) as Awaited<ReturnType<typeof init.bootstrap>>;
                expect(lemonContext.config.projects.length).toBeGreaterThan(0);
                const projectA = lemonContext.config.projects.find((project) => project.name === 'projectA');
                expect(projectA).toBeTruthy();
                expect(projectA?.root).toEqual('./projectA');
            });
        });
    });
});
