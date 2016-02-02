// Easy Type definitions for enml-js

declare module "enml-js" {
    namespace enmljs {
        interface apply {
            ENMLOfPlainText(text: string): string;
            PlainTextOfENML(enml: string): string;
        }
    }

    var enmljs: enmljs.apply;

    export = enmljs;
}
