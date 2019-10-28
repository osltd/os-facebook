// Only load the .env file from local!
if(!/^prod$/i.test(process.env.NODE_ENV)){
    require('dotenv').config();
}

const express          = require('express');
const app              = express();
const passport         = require('passport');
const FacebookStrategy = require('passport-facebook');
const FB               = require('fb');
const cookieParser     = require('cookie-parser');
const fs               = require('fs');
const config           = require('./src/constants/config');

// attach libraries
app.use(cookieParser());
app.use(passport.initialize());
// configuare passport
passport.serializeUser((user, done) => done(null, user));
passport.use(new FacebookStrategy({
    clientID     : config.FB.ID,
    clientSecret : config.FB.KEY,
    callbackURL  : config.APP.URL + '/pages'
}, function(accessToken, refreshToken, profile, cb) {
    FB.setAccessToken(accessToken);
    cb(null, profile);
}));

// load routers
const ROUTERS = fs.readdirSync('./src/routers');
// apply routers
ROUTERS.forEach(router => app.use('/', require(`./src/routers/${router}`)));

app.listen(config.APP.PORT, () => console.log(`FB engine is listening on port ${config.APP.PORT}!`));

module.exports = app;
