<?php

namespace Pterodactyl\BlueprintFramework\Extensions\quickinstall;

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

    /**
     * Download a plugin from Modrinth.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function download(Request $request)
    {
        // 1. Validate Input
        $request->validate([
            'downloadUrl' => 'required|url',
            'filename' => 'required|string|ends_with:.jar',
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();

        // 2. Verify Permission (Check if user can create files on this server)
        $this->authorize('file.create', $server);

        $url = $request->input('downloadUrl');
        $filename = $request->input('filename');

        try {
            // 3. Download File Content (using Laravel Http client)
            $response = Http::get($url);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to download file from Modrinth.'
                ], 502);
            }

            $content = $response->body();

            // 4. Save to Server via Wings (DaemonFileRepository)
            // We save to /plugins/panel-filename.jar to track panel-installed plugins
            $path = '/plugins/panel-' . $filename;

            // Put content
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

    /**
     * Delete an installed plugin.
     */
    public function deletePlugin(Request $request)
    {
        $request->validate([
            'filename' => 'required|string|starts_with:panel-',
            'serverUuid' => 'required|string|exists:servers,uuid',
        ]);

        $server = Server::where('uuid', $request->input('serverUuid'))->firstOrFail();
        $this->authorize('file.delete', $server);

        try {
            $this->fileRepository->setServer($server)->deleteFiles('/plugins', [$request->input('filename')]);

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
