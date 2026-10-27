/**
 * Lazy database handle.
 *
 * The scan plugin is the only writer, and the CLI, `--help`, and the MCP
 * server must all work without a database. Prisma is therefore imported on
 * first use, and only when `DATABASE_URL` is set. A missing URL disables
 * persistence instead of failing the command.
 *
 * The generated client lives under the `@prisma/client` package; run
 * `npm run prisma:generate` (and `prisma migrate deploy` against a real
 * database) before relying on scan persistence.
 */

type PrismaLike = {
    $disconnect: () => Promise<void>
} & Record<string, any>;

let client: PrismaLike | null = null;
let attempted = false;

export const getPrisma = async (): Promise<PrismaLike | null> => {
    if (attempted) { return client; }
    attempted = true;
    if (!process.env.DATABASE_URL) { return null; }
    // Dynamic, non-literal specifier: the build must not depend on a generated
    // Prisma client. Type resolution happens only when there is a database.
    const prismaModuleName = '@prisma/client';
    // webpackIgnore keeps the bundle from trying to resolve a non-literal
    // request at build time; Node resolves it at runtime, on first use.
    const prismaModule: any = await import(/* webpackIgnore: true */ prismaModuleName);
    const PrismaClient = prismaModule.PrismaClient ?? prismaModule.default?.PrismaClient ?? prismaModule.default;
    client = new PrismaClient() as unknown as PrismaLike;
    return client;
};

export const disconnectPrisma = async (): Promise<void> => {
    if (!client) { return; }
    await client.$disconnect();
    client = null;
};
