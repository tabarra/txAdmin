declare global {
    namespace NodeJS {
        interface Global {
            globals: any;
            GlobalData: any;
        }
        interface ProcessEnv {
            [x: string ]: string;
       }
    }
}
