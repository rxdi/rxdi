import { Service, Inject } from "@rxdi/core";
import open = require('opn');
import { HAPI_SERVER } from "../../hapi.module.config";
import { Server } from "hapi";

@Service()
export class OpenService {

    constructor(
        @Inject(HAPI_SERVER) private server: Server,
    ) { }

    async openServerPage() {
        await open(`http://${this.server.info.address}:${this.server.info.port}/public`);
    }

    async openGraphQLPage() {
        await open(`http://${this.server.info.address}:${this.server.info.port}/graphiql`);
    }

    async openPage(link) {
        await open(link);
    }

}