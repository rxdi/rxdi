export interface Route<C> {
    path: string;
    component?: C;
    action?: () => Promise<any>;
}

export interface RouterOptions {
    baseUrl: string;
}
export interface NavigationTrigger {}
export declare class Router {
    public static go(path): boolean;
    static setTriggers(triggers: NavigationTrigger): void
    constructor(element: any, options: { baseUrl?: string; });
    setRoutes(routes: Route[]): void;
    setOutlet(outlet: Node): void;
    urlForName(url: string, params: any): string;
    urlForPath(url: string, params: any): string;
    getOutlet(): Node;
    getRoutes(): any;
    render(pathnameOrContext: string | { pathname: string; }, shouldUpdateHistory): Promise<Node>;
    removeRoutes(): void;
    subscribe(): void;
    unsubscribe(): void;
    addRoutes(routes: Route<C> | Route<C>[]): Route[];
    location: {
        routes: Route<C>[];
        params: any
    }
}