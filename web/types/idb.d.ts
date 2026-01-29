/**
 * Declare 'idb' for type-checking when core/health-check.ts is built by the web app.
 * The package is installed in web/node_modules; resolution from ../core doesn't see it.
 */
declare module 'idb' {
  export function openDB<T = unknown>(
    name: string,
    version: number,
    options?: { upgrade?: (db: IDBDatabase) => void }
  ): Promise<{
    put: (store: string, value: unknown) => Promise<void>;
    get: (store: string, key: string) => Promise<unknown>;
    getAllFromIndex: (store: string, index: string, key: string) => Promise<unknown[]>;
    countFromIndex: (store: string, index: string, key: string) => Promise<number>;
  } & IDBDatabase>;
}
