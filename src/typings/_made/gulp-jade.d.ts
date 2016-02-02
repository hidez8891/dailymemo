// Easy Type definitions for gulp-jade

declare module "gulp-jade" {
    namespace jade {
        interface apply {
            (opt?: ApplyOptions): NodeJS.ReadWriteStream;
        }

        interface ApplyOptions {
            pretty?: boolean;
        }
    }

    var jade: jade.apply;

    export = jade;
}
