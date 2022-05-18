const PouchDB = require('pouchdb-node');

const main = async () => {
    try {
        //Start db
        const db = new PouchDB('./test/pouchdb_data');

        //Insert some random data
        for (let i = 0; i < 100; i++) {
            await db.post({
                rand: Math.random(),
            });
        }
    } catch (error) {
        console.log(error.message);
        console.dir(error);
    }
};
main();
