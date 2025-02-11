const ogDir = console.dir
console.dir = (...args) => {
    ogDir(...args);
    console.log('----------------------');
}

console.log('Bun.version');
console.dir(Bun.version);

console.log('argv');
console.dir(process.argv);

console.log('argv0');
console.dir(process.argv0);

console.log('execArgv');
console.dir(process.execArgv);


//absolute path to the current entrypoint
console.log('Bun.main');
console.dir(Bun.main);

// if the current file is the entrypoint
console.log('import.meta.main');
console.dir(import.meta.main);

//the absolute path of the current file
console.log('import.meta.path');
console.dir(import.meta.path);

//directory of the current file
console.log('import.meta.dir');
console.dir(import.meta.dir);

//the file name of the current file
console.log('import.meta.file');
console.dir(import.meta.file);

console.log('process.cwd()');
console.dir(process.cwd());


// console.log('import.meta');
// console.dir(import.meta);

// console.log('proc env');
// console.dir(process.env);

console.log('='.repeat(50));

import path from 'node:path';
// const fileUrl = Bun.pathToFileURL(process.argv0);
console.dir(path.parse(process.argv0).dir);
