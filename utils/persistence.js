
function PersistenceController() {
    const Mongo = require('mongodb');
    const MongoClient = Mongo.MongoClient;
    const logger = require('../utils/logging').Logger('persistence');

    let client;
    let db_name;
    let db;

    function mongoInit(url='mongodb://localhost:27017/', db_nom='fp-bot') {
        db_name = db_nom;
        client = new MongoClient(url, {
            useNewUrlParser: true,
        });
    }

    async function listCollections() {
        if(db_name === undefined || client === undefined)
            throw new Error('Db or client are undefined');

        try {
            await client.connect();
            return new Promise((resolve, reject) => {
                db = client.db(db_name);
                db.listCollections({},{nameOnly:true}).toArray(function(err, collInfos) {
                    if(err)
                        reject(err);
                    client.close();
                    resolve(collInfos);
                });

            });
        } catch(err) {
            logger.log('error', err.stack);
            return Promise.reject(err);
        }
    }

    async function fetchData(limitData, collection='detection') {
        if(db_name === undefined || client === undefined)
            throw new Error('Db or client are undefined');

        try {
            await client.connect();
            logger.log('debug', 'Successfully connected to server');

            db = client.db(db_name);
            const col = db.collection(collection);
            const docs = await col.find().limit(limitData).toArray();
            return new Promise((resolve) => {
                client.close();
                resolve(docs);
            });

        } catch(err) {
            logger.log('error', err.stack);
            return Promise.reject(err);
        }
    }

    async function fetchById(id, collection='detection') {
        if(db_name === undefined || client === undefined)
            throw new Error('Db or client are undefined');

        try {
            let o_id = new Mongo.ObjectID(id);
            await client.connect();
            logger.log('debug', 'Successfully connected to server');

            db = client.db(db_name);
            const col = db.collection(collection);
            const doc = await col.findOne({'_id':o_id});
            return new Promise((resolve) => {
                client.close();
                resolve(doc);
            });

        } catch(err) {
            logger.log('error', err.stack);
            return Promise.reject(err);
        } finally {
            client.close();
        }

    }

    return {
        mongoInit: mongoInit,
        listCollections: listCollections,
        fetchData: fetchData,
        fetchById: fetchById,
    }
}

module.exports = new PersistenceController();

