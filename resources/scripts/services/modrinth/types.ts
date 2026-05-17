import type { Labrinth } from '@modrinth/api-client';

export type Platform = 'modrinth' | 'spigotmc';

export interface UnifiedPlugin {
    id: string;
    title: string;
    description: string;
    author: string;
    downloads: number;
    icon_url: string;
    categories: string[];
    date_modified: string;
    platform: Platform;
}

export interface VersionFile {
    url: string;
    filename: string;
    primary: boolean;
    size: number;
}

export interface UnifiedVersion {
    id: string;
    name: string;
    version_type: string;
    date_published: string;
    downloads: number;
    files: VersionFile[];
    game_versions: string[];
    loaders: string[];
}

export interface SearchFilters {
    category: string;
    loader: string;
    sort: string;
}

export interface VersionFilters {
    gameVersion: string;
    loader: string;
    type: string;
}

export interface SearchResult {
    plugins: UnifiedPlugin[];
    total: number;
}

export function adaptSearchHit(hit: Labrinth.Search.v2.ResultSearchProject): UnifiedPlugin {
    return {
        id: hit.project_id,
        title: hit.title,
        description: hit.description,
        author: hit.author,
        downloads: hit.downloads,
        icon_url: hit.icon_url,
        categories: hit.categories,
        date_modified: hit.date_modified,
        platform: 'modrinth',
    };
}

export function adaptVersion(v: Labrinth.Versions.v3.Version): UnifiedVersion {
    return {
        id: v.id,
        name: v.name,
        version_type: v.version_type,
        date_published: v.date_published,
        downloads: v.downloads,
        files: v.files.map(f => ({
            url: f.url,
            filename: f.filename,
            primary: f.primary,
            size: f.size,
        })),
        game_versions: v.game_versions,
        loaders: v.loaders,
    };
}
