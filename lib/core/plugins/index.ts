import { LemonPlugin } from '@lemon/extract/core/types/lemonPlugin';
import debug from './debug';
import git from './git';
import github from './github';
import init from './init';
import npm from './npm';
import scan from './scan';

const corePlugins: LemonPlugin[] = [
    init,
    git,
    github,
    scan,
    npm,
    debug
];

export {
    corePlugins
};
