import { Server } from "hapi";
export declare class OpenService {
    private server;
    constructor(server: Server);
    openServerPage(): Promise<void>;
    openGraphQLPage(): Promise<void>;
    openPage(link: any): Promise<void>;
}
