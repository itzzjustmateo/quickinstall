<?php

namespace Pterodactyl\BlueprintFramework\Extensions\QuickInstall;

use Illuminate\Http\Request;
use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\Http;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;

class PluginController extends Controller
{
    private DaemonFileRepository $fileRepository;

    public function __construct(DaemonFileRepository $fileRepository)
    {
        $this->fileRepository = $fileRepository;
    }

    private function isValidModrinthUrl(string $url): bool
    {
        return str_starts_with($url, 'https://cdn.modrinth.com/');
    }

    private function isValidSpigotUrl(string $url): bool
    {
        return str_starts_with($url, 'https://api.spiget.org/');
    }

    public function search(Request $request)
    {
        $request->validate([
            'platform' => 'required|in:modrinth,spigotmc',
            'query' => 'nullable|string|max:100',
            'page' => 'nullable|integer|min:0',
            'category' => 'nullable|string',
            'loader' => 'nullable|string',
            'sort' => 'nullable|string|in:relevance,downloads,newest,updated,follows',
        ]);

        $platform = $request->input('platform');
        $query = $request->input('query', '');
        $page = $request->input('page', 0);
        $category = $request->input('category', '');
        $loader = $request->input('loader', '');
        $sort = $request->input('sort', 'relevance');
        $limit = 12;
        $offset = $page * $limit;

        if ($platform === 'modrinth') {
            return $this->searchModrinth($query, $offset, $limit, $category, $loader, $sort);
        }

        return $this->searchSpigot($query, $offset, $limit, $category, $sort);
    }

    private function searchModrinth(string $query, int $offset, int $limit, string $category, string $loader, string $sort): \Illuminate\Http\JsonResponse
    {
        $facets = [['project_type:plugin']];
        if ($category) $facets[] = ["categories:$category"];
        if ($loader) $facets[] = ["categories:$loader"];

        $indexMap = [
            'relevance' => 'relevance',
            'downloads' => 'downloads',
            'newest' => 'newest',
            'updated' => 'updated',
            'follows' => 'follows',
        ];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
            ])->get('https://api.modrinth.com/v2/search', [
                'query' => $query,
                'facets' => json_encode($facets),
                'limit' => $limit,
                'offset' => $offset,
                'index' => $indexMap[$sort] ?? 'relevance',
            ]);

            if (!$response->successful()) {
                return response()->json(['success' => false, 'message' => 'Failed to fetch from Modrinth'], 502);
            }

            $data = $response->json();
            $plugins = array_map(fn($p) => [
                'id' => $p['project_id'],
                'title' => $p['title'],
                'description' => $p['description'],
                'author' => $p['author'],
                'downloads' => $p['downloads'],
                'icon_url' => $p['icon_url'],
                'categories' => $p['categories'] ?? [],
                'date_modified' => $p['date_modified'],
                'platform' => 'modrinth',
            ], $data['hits'] ?? []);

            return response()->json([
                'success' => true,
                'plugins' => $plugins,
                'total' => $data['total_hits'] ?? 0,
            ]);
        } catch (\Exception $ex) {
            return response()->json(['success' => false, 'message' => $ex->getMessage()], 500);
        }
    }

    private function searchSpigot(string $query, int $offset, int $limit, string $category, string $sort): \Illuminate\Http\JsonResponse
    {
        $pageNum = floor($offset / $limit) + 1;
        $sortMap = [
            'relevance' => '-downloads',
            'downloads' => '-downloads',
            'newest' => '-releaseDate',
            'updated' => '-updateDate',
        ];
        $sortParam = $sortMap[$sort] ?? '-downloads';

        try {
            $url = $query
                ? "https://api.spiget.org/v2/search/resources/" . urlencode($query)
                : ($category
                    ? "https://api.spiget.org/v2/categories/$category/resources"
                    : 'https://api.spiget.org/v2/resources');

            $response = Http::withHeaders([
                'Accept' => 'application/json',
            ])->get($url, [
                'field' => 'name',
                'size' => $limit,
                'page' => $pageNum,
                'sort' => $sortParam,
            ]);

            if (!$response->successful()) {
                return response()->json(['success' => false, 'message' => 'Failed to fetch from SpigotMC'], 502);
            }

            $data = $response->json();
            $plugins = array_map(fn($p) => [
                'id' => (string) $p['id'],
                'title' => $p['name'],
                'description' => $p['tag'] ?? '',
                'author' => $p['author']['name'] ?? 'Unknown',
                'downloads' => $p['downloads'] ?? 0,
                'icon_url' => isset($p['icon']['url']) ? 'https://www.spigotmc.org/' . $p['icon']['url'] : '',
                'categories' => [$p['category']['name'] ?? 'Plugin'],
                'date_modified' => isset($p['updateDate']) ? date('c', $p['updateDate']) : date('c'),
                'platform' => 'spigotmc',
            ], $data);

            return response()->json([
                'success' => true,
                'plugins' => $plugins,
                'total' => 1000,
            ]);
        } catch (\Exception $ex) {
            return response()->json(['success' => false, 'message' => $ex->getMessage()], 500);
        }
    }

    public function getVersions(Request $request)
    {
        $request->validate([
            'platform' => 'required|in:modrinth,spigotmc',
            'pluginId' => 'required|string',
        ]);

        $platform = $request->input('platform');
        $pluginId = $request->input('pluginId');

        if ($platform === 'modrinth') {
            return $this->getModrinthVersions($pluginId);
        }

        return $this->getSpigotVersions($pluginId);
    }

    private function getModrinthVersions(string $projectId): \Illuminate\Http\JsonResponse
    {
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
            ])->get("https://api.modrinth.com/v2/project/$projectId/version");

            if (!$response->successful()) {
                return response()->json(['success' => false, 'message' => 'Failed to fetch versions'], 502);
            }

            $versions = $response->json();

            return response()->json([
                'success' => true,
                'versions' => $versions,
            ]);
        } catch (\Exception $ex) {
            return response()->json(['success' => false, 'message' => $ex->getMessage()], 500);
        }
    }

    private function getSpigotVersions(string $resourceId): \Illuminate\Http\JsonResponse
    {
        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
            ])->get("https://api.spiget.org/v2/resources/$resourceId/versions", [
                'size' => 20,
                'sort' => '-releaseDate',
            ]);

            if (!$response->successful()) {
                return response()->json(['success' => false, 'message' => 'Failed to fetch versions'], 502);
            }

            $versions = $response->json();

            $formatted = array_map(fn($v) => [
                'id' => (string) $v['id'],
                'name' => $v['name'] ?? "Version {$v['id']}",
                'version_type' => 'release',
                'date_published' => date('c', $v['releaseDate']),
                'downloads' => 0,
                'files' => [[
                    'url' => "https://api.spiget.org/v2/resources/$resourceId/versions/{$v['id']}/download",
                    'filename' => "spigot_{$resourceId}_{$v['id']}.jar",
                    'primary' => true,
                    'size' => 0,
                ]],
                'game_versions' => [],
                'loaders' => ['spigot', 'paper', 'bukkit'],
            ], $versions);

            return response()->json([
                'success' => true,
                'versions' => $formatted,
            ]);
        } catch (\Exception $ex) {
            return response()->json(['success' => false, 'message' => $ex->getMessage()], 500);
        }
    }

    public function download(Request $request)
    {
        $request->validate([
            'downloadUrl' => 'required|url',
            'filename' => 'required|string|regex:/^[a-zA-Z0-9_\-\.]+\.jar$/',
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
        $this->authorize('file.create', $server);

        $url = $request->input('downloadUrl');
        $filename = $request->input('filename');

        if (!$this->isValidModrinthUrl($url) && !$this->isValidSpigotUrl($url)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid download URL. Only Modrinth and SpigotMC downloads are allowed.'
            ], 400);
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/java-archive',
            ])->get($url);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to download file from provider.'
                ], 502);
            }

            $content = $response->body();

            if (strlen($content) < 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Downloaded file is too small to be a valid plugin.'
                ], 400);
            }

            $path = '/plugins/panel-' . basename($filename);

            $this->fileRepository->setServer($server)->putContent($path, $content);

            return response()->json([
                'success' => true,
                'path' => $path
            ]);

        } catch (DaemonConnectionException $ex) {
            return response()->json([
                'success' => false,
                'message' => 'Could not connect to server daemon.',
                'error' => $ex->getMessage()
            ], 500);
        } catch (\Exception $ex) {
            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred.',
                'error' => $ex->getMessage()
            ], 500);
        }
    }

    /**
     * Get a list of installed plugins with the panel- prefix.
     */
    public function getInstalled(Request $request)
    {
        $request->validate([
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
        $this->authorize('file.list', $server);

        try {
            $files = $this->fileRepository->setServer($server)->getDirectory('/plugins');
            
            $installed = [];
            foreach ($files as $file) {
                if (str_starts_with($file['name'], 'panel-')) {
                    $installed[] = [
                        'name' => $file['name'],
                        'size' => $file['size'],
                        'mimetype' => $file['mimetype'],
                        'modified_at' => $file['modified_at'],
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'plugins' => $installed
            ]);
        } catch (\Exception $ex) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to list plugins.',
                'error' => $ex->getMessage()
            ], 500);
        }
    }

    public function deletePlugin(Request $request)
    {
        $request->validate([
            'filename' => 'required|string|starts_with:panel-|regex:/^panel-[a-zA-Z0-9_\-\.]+$/',
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
        $this->authorize('file.delete', $server);

        $filename = $request->input('filename');
        
        if (in_array($filename, ['panel-.', 'panel-..']) || str_contains($filename, '..')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid filename.',
            ], 400);
        }

        try {
            $this->fileRepository->setServer($server)->deleteFiles('/plugins', [$filename]);

            return response()->json(['success' => true]);
        } catch (\Exception $ex) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete plugin.',
                'error' => $ex->getMessage()
            ], 500);
        }
    }
}
