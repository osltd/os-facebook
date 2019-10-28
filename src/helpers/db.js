const mysql  = require('mysql');
const config = require('../constants/config');

module.exports = {
    // setup query method
    query : function(query, args) {
        // returns a promise
        return new Promise((resolve, reject) => {
            // create db connection 
            var db = mysql.createConnection(config.DB);
            // connect db
            db.connect(connErr => {
                // connection error
                if(connErr){
                    reject({
                        code    : 500,
                        message : connErr.message || connErr
                    });
                } else {
                    db.query(query, args, (queryErr, result) => {
                        // close connection
                        db.end();
                        // error?
                        queryErr ? reject({
                            code    : 500,
                            message : queryErr.error || queryErr
                        }) : resolve(result);
                    });
                }
            })
        });
    }
}