import { GenericModrinthClient } from '@modrinth/api-client';

let instance: GenericModrinthClient | null = null;

export function getModrinthClient(): GenericModrinthClient {
    if (!instance) {
        instance = new GenericModrinthClient({
            userAgent: 'fernsehheft/quickinstall/1.2.2',
        });
    }
    return instance;
}

export function resetModrinthClient(): void {
    instance = null;
}
