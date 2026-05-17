import { getModrinthClient } from './client';
import type { UnifiedVersion } from './types';
import { adaptVersion } from './types';

export interface ProjectVersionsResult {
    versions: UnifiedVersion[];
    availableGameVersions: string[];
    availableLoaders: string[];
}

export async function getProjectVersions(projectId: string): Promise<ProjectVersionsResult> {
    const client = getModrinthClient();

    const sdkVersions = await client.labrinth.versions_v3.getProjectVersions(projectId);

    return {
        versions: sdkVersions.map(adaptVersion),
        availableGameVersions: [...new Set(sdkVersions.flatMap(v => v.game_versions))].sort().reverse(),
        availableLoaders: [...new Set(sdkVersions.flatMap(v => v.loaders))],
    };
}
