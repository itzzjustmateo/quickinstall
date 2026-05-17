import http from '@/api/http';

export interface DownloadRequest {
    downloadUrl: string;
    filename: string;
    serverUuid: string;
}

export interface DownloadResponse {
    success: boolean;
    path?: string;
    message?: string;
}

export async function downloadPluginToServer(params: DownloadRequest): Promise<DownloadResponse> {
    const { data } = await http.post<DownloadResponse>(
        `/extensions/modrinthbrowser/download`,
        params
    );
    return data;
}
