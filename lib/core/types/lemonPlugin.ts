import { LemonContext } from '@lemon/extract/core/types/lemonContext';

export interface LemonPlugin {
    name?: string;
    extractCmd?: string;
    description?: string;
    bootstrap?: (lemonContext: LemonContext) => Promise<LemonContext>;
    main?: (lemonContext: LemonContext) => Promise<LemonContext>;
}
