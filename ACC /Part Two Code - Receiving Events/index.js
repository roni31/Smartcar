var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var memoryStore = session.MemoryStore;
var store = new memoryStore();
var request = require('request');
var cookieParser = require('cookie-parser');
var nconf = require('nconf');
var fs = require('fs');
var coffee = require('coffee-script');

//INIT PUBNUB
var pubnub = require('pubnub').init({
  publish_key: 'demo',
  subscribe_key: 'demo'
});

function pub(message) {
  pubnub.publish({
    channel: "automaticChannel",
    message: message,
    callback: function(message) {console.log('sent: ', message)}
  })
}

//INIT EXPRESS
var app = express();
//configure
app.set('store', store);
app.set('views', __dirname + '/client/views');

app.set('view engine', 'jade');
app.set('port', (process.env.PORT || 5000));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

//app.use(cookieParser(nconf.get('SESSION_SECRET')));
app.use(session({
  store: store,
  secret: 'keyboard cat',
  saveUninitialized: true,
  resave: true,
  cookie: {maxAge: 31536000000}
}));

// OAUTH2
var oauth2 = require('simple-oauth2')({
  clientID: '<your-automatic-id>',
  clientSecret: '<your-automatic-secret>',
  site: 'https://accounts.automatic.com',
  tokenPath: '/oauth/access_token'
});

var authorization_uri = oauth2.authCode.authorizeURL({
  scope: 'scope:trip scope:location scope:vehicle:profile scope:vehicle:events'
});

//ROUTES
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.redirect(authorization_uri);
});

app.get('/main', function(req, res) {
  var code = req.query.code;

  oauth2.authCode.getToken({
    code: code
  }, function(e, result) {
    if(e) return next(e);

    // Attach `token` to the user's session for later use
    var token = oauth2.accessToken.create(result);

    req.session.access_token = token.token.access_token;
    req.session.user_id = token.token.user.id;

    res.redirect('/redirect_main');
  });
});

app.get('/redirect_main', function(req, res) {
  res.render('redirect_main');
});

app.get('/map_box_example', function(req, res) {
  res.render('map_box_example');
})

app.post('/incomingWebhooks', function(req, res) {
  pub(req.body);
  res.send(JSON.stringify({ok:true, status:200}));
});

app.get('/app.css', function(req, res) {
  res.header('Content-Type', 'text/css');
  file = fs.readFileSync(__dirname + '/client/styles/css/app.css', 'ascii');
  res.send(file);
})

app.get('/:script.js', function(req, res) {
  res.header('Content-Type', 'application/x-javascript');
  cs = fs.readFileSync(__dirname + '/client/js/' + req.params.script + '.coffee', 'ascii');
  js = coffee.compile(cs);
  res.send(js);
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
