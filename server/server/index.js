const port = 5000

import express from 'express'
const app = express()

import bodyParser from 'body-parser'
app.use(bodyParser.urlencoded({ extended: true }));
app.use( bodyParser.json() );       // to support JSON-encoded bodies

import session from 'express-session'
app.use(session({
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

import multer from 'multer';

const api = require('./routes/loancoin_oracle_api.js');

app.use(express.static('public'))

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// get  test
app.get('/api/echo', api.echo);

// api for example application
app.post('/api/add_loan_initiation', api.add_loan_initiation);
app.post('/api/get_loan_list', api.get_loan_list);
app.post('/api/give_me_ether', api.give_me_ether);
app.post('/api/apply_to_loan', api.apply_to_loan);
app.post('/api/approve_borrower', api.approve_borrower);
app.post('/api/delete_loan_contract', api.delete_loan_contract);
app.post('/api/send_signature', api.send_signature);
app.post('/api/send_uport_profile', api.send_uport_profile);
app.post('/api/get_uport_profile', api.get_uport_profile);

app.listen(port);
console.log('Listening on port '+port+'...');
