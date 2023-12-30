import { LemonPlugin } from '@lemon/extract/core/types/lemonPlugin';
import apollo from './apollo';
import debug from './debug';
import git from './git';
import github from './github';
import init from './init';

const corePlugins: LemonPlugin[] = [
    apollo,
    init,
    git,
    github,
    debug
];

export {
    corePlugins
};
