import path from "node:path";
import { vi, inject } from "vitest";

// Mutable state populated below, read lazily by the mock factory
const mockPaths = vi.hoisted(() => ({
    fxsPath: '',
    txaPath: '',
    txaResourceName: '',
}));

//MARK: Mock getRuntimeInfo
// In the deployed bundle, __dirname resolves to .../system_resources/monitor/core,
// but during vitest it points to the actual source tree (core/boot), which doesn't
// match the expected structure. Mock the whole function with test-appropriate values.
vi.mock('@core/boot/getRuntimeInfo', () => ({
    getRuntimeInfo: () => ({
        isWindows: process.platform === 'win32',
        runtime: 'fxserver',
        runtimeNodeVersion: process.versions.node,
        runtimeVersionTag: `fxs/24574`,
        txaPath: mockPaths.txaPath,
        txaResourceName: mockPaths.txaResourceName,
        fxsPath: mockPaths.fxsPath,
        fxsVersionInfo: {
            valid: true,
            branch: 'master',
            build: 24574,
            raw: 'master SERVER v1.0.0.24574 win32',
        },
    }),
}));

// Populate mock paths from the global setup
const fxsPath = inject('fxsPath');
const txaResourceName = inject('txaResourceName');
mockPaths.fxsPath = fxsPath;
mockPaths.txaResourceName = txaResourceName;
mockPaths.txaPath = path.join(fxsPath, 'system_resources', txaResourceName);

//MARK: Stub globals
// esbuild replaces TX_RELEASE_VERSION at build time; stub it for tests
vi.stubGlobal('TX_RELEASE_VERSION', '0.0.0');
