import { NgModule } from '@angular/core';
import { ServerService } from './services/server/server.service';
import { NamespaceService } from './services/namespace/namespace.service';
import { FileService } from './services/file/file.service';
import { BuilderService } from './services/builder/builder.service';
import { BackService } from './services/back.service';
import { LoggerService } from './services/logger/logger.service';

@NgModule({
    providers: [
        ServerService,
        NamespaceService,
        FileService,
        BuilderService,
        BackService,
        LoggerService
    ]
})
export class CoreModule {}
