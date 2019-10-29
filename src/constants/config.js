
// get env config
const e = process.env || {};

module.exports = {
  APP : {
    URL  : e.APP_URL,
    PORT : e.PORT
  },
  FB  : {
    ID  : e.FB_APP_ID,
    KEY : e.FB_APP_KEY
  },
  OS  : {
    ENDPOINT : "https://api.oneshop.cloud",
    ID       : e.OS_MALL_ID,
    KEY      : e.OS_MALL_KEY
  },
  DB  : {
    host               : e.DB_HOST,
    port               : "3306",
    user               : e.DB_USER,
    password           : e.DB_PASSWORD,
    database           : e.DB_NAME,
    charset            : "utf8mb4_unicode_ci",
    timezone           : "UTC+0",
    multipleStatements : true
  },
  S3 : {
    accessKeyId     : e.S3_ACCESS_ID,
    secretAccessKey : e.S3_ACCESS_KEY,
    region          : "ap-southeast-1",
    httpOptions: {
      timeout: 1800000
    }
  }
}