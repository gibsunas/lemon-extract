import { LemonPlugin } from '@lemon/extract/core/types/lemonPlugin';
import apollo from './apollo';
import debug from './debug';
import git from './git';
import github from './github';
import init from './init';
import npm from './npm';
import scan from './scan';

const corePlugins: LemonPlugin[] = [
    apollo,
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
