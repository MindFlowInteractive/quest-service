export interface ServiceConfig {
    url: string;
    prefix: string;
    healthPath: string;
}

export interface ServicesConfig {
    [serviceName: string]: ServiceConfig;
}

export const getServiceByPrefix = (
    services: ServicesConfig,
    path: string,
): { name: string; config: ServiceConfig } | null => {
    for (const [name, config] of Object.entries(services)) {
        if (path.startsWith(config.prefix)) {
            return { name, config };
        }
    }
    return null;
};

export const stripPrefix = (path: string, prefix: string): string => {
    return path.replace(prefix, '') || '/';
};
