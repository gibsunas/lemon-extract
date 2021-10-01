import Debug, { Debugger } from 'debug';

export const debug: typeof Debugger = Debug('@lemon/extract');

export default { debug };
