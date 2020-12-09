import { ReflectDecorator } from '../../helpers/reflect.decorator';
import { ResponseToolkit, Request } from 'hapi';

export interface PluginInterface {
    name?: string;
    version?: string;
    register?(server?, options?): Promise<void>;
    handler?(request: Request, h: ResponseToolkit): any;
}
export function Plugin(options?: any): Function {
    return ReflectDecorator(options, { type: 'plugin' });
}