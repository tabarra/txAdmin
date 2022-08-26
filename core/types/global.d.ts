declare global {
    namespace NodeJS {
        interface Global {
            globals: any;
        }
        interface ProcessEnv {
            [x: string ]: string;
       }
    }
}
