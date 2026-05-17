import type { Labrinth } from '@modrinth/api-client';
import { getModrinthClient } from './client';
import type { SearchResult, SearchFilters } from './types';
import { adaptSearchHit } from './types';

export interface ModrinthSearchParams {
    query: string;
    offset: number;
    filters: SearchFilters;
}

export async function searchModrinthProjects(params: ModrinthSearchParams): Promise<SearchResult> {
    const { query, offset, filters } = params;
    const client = getModrinthClient();

    const facets: string[][] = [['project_type:plugin']];
    if (filters.category) {
        facets.push([`categories:${filters.category}`]);
    }
    if (filters.loader) {
        facets.push([`categories:${filters.loader}`]);
    }

    const searchParams: Labrinth.Projects.v2.ProjectSearchParams = {
        facets,
        limit: 12,
        offset,
        index: filters.sort as Labrinth.Projects.v2.ProjectSearchParams['index'],
    };

    if (query) {
        searchParams.query = query;
    }

    const result = await client.labrinth.projects_v2.search(searchParams);

    return {
        plugins: result.hits.map(adaptSearchHit),
        total: result.total_hits,
    };
}
