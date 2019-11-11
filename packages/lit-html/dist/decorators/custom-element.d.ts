interface CustomElementConfig {
    selector: string;
    template: string;
    style?: string;
    useShadow?: boolean;
}
export declare const CustomElement: (config: CustomElementConfig) => (cls: any) => void;
export {};
