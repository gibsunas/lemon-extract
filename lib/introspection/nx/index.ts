/* eslint-disable no-unreachable */

interface RunContext {
  rootDir: string,
}

interface Introspection {
  files?: string[],
  message: string,
  reason?: string,
  type: 'warning' | 'error',
}
interface IntrospectionError extends Introspection {
  type: 'error'
}

interface IntrospectionWarning extends Introspection {
  type: 'warning'
}
interface IntrospectionResult {
  errors: Object[],
  name: string,
  warnings: Object[],
}
interface NxIntrospectionResult extends IntrospectionResult {
  versions? : { cli?: { global?: string, local?: string }, workspace?: string },
  paths?: { nxJson?: string, workspaceJson?: string, }
}

const introspectNx : (runContext: RunContext) => NxIntrospectionResult = (inspectionContext:RunContext) => {
    return;
};

const Nx = (runContext: RunContext) => introspectNx(runContext);

export { Nx };
