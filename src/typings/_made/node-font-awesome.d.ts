// Easy Type definitions for node-font-awesome

declare module "node-font-awesome" {
    namespace fontawesome {
        interface entry {
            scssPath: string;
            lessPath: string;
            css: string;
            fonts: string;
        }
    }

    var fontawesome: fontawesome.entry;

    export = fontawesome;
}
