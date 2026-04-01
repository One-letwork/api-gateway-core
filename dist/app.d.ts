import { Express } from "express";
export interface AppConfig {
    port?: number;
    nodeEnv?: "development" | "production" | "test";
    enableCors?: boolean;
    enableCompression?: boolean;
    enableRequestLogging?: boolean;
    trustedProxies?: string[];
    bodyLimit?: string;
    jsonLimit?: string;
    urlLimit?: string;
}
export declare class AppFactory {
    static createApp(config?: AppConfig): Express;
    static setupErrorHandling(app: Express): Express;
    static startServer(app: Express, port?: number): Promise<void>;
}
//# sourceMappingURL=app.d.ts.map