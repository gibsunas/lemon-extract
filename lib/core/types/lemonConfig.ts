import { ProjectConfig } from '../repos';

export interface LemonConfig {
    organization?: string;
    contextRepo?: string;
    projects?: ProjectConfig[];
    cwd?: string;
    lemonRcPath?: string;
}
