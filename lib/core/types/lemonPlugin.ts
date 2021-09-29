import { LemonContext } from '@lemon/extract/core/types/lemonContext';

export interface LemonPlugin {
    name: string;
    main: (lemonContext: LemonContext) => Promise<LemonContext>;
}
