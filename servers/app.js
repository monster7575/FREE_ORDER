var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-locals');
var useragent = require('express-useragent');
var session = require('express-session');

var index = require('../routes/index');
var buyer = require('../routes/buyer');
var seller = require('../routes/seller');
var goods = require('../routes/goods');
var sellmsglog = require('../routes/sellmsglog');
var buymsglog = require('../routes/buymsglog');

var app = express();
// view engine setup
app.engine('ejs',engine);
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(useragent.express());
app.use(session({
  secret: '$loveforever$',
  resave: false,
  saveUninitialized: true
}));

app.use('/srv/', index);
app.use('/srv/buyer', buyer);
app.use('/srv/seller', seller);
app.use('/srv/goods', goods);
app.use('/srv/sellmsglog', sellmsglog);
app.use('/srv/buymsglog', buymsglog);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
