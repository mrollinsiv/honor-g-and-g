'use strict';

// Imports
const Koa = require('koa');
const nunjucks = require('koa-nunjucks-async');
const serve = require('koa-static');
const https = require('https');
const fs = require('fs');
const Router = require('koa-router');

// Constants
const publicConfig = require('./config/globals')[process.env.NODE_ENV];
const privateConfig = require('./config/private')[process.env.NODE_ENV];

// Routes
const homeRoutes = require('./routes/home');

// Initialize the app
const app = new Koa();
const router = new Router();
const nunjucksOptions = {
  ext: '.html.twig'
};

// Load other middlewares...

// Redirect to HTTPS
app.use(async (ctx, next) => {
  if (!ctx.secure) {
    var href = ctx.href.replace('http:', 'https:').replace(':3000', ':3001');
    ctx.redirect(href);
  }
  return next();
});

// Serve static assets
app.use(serve('./web'));

// Send config data to middleware
app.use(async (ctx,next) => {
  ctx.state.globals = {
    public: publicConfig,
    private: privateConfig
  };
  return next();
});

// Load nunjucks last before routes
app.use(nunjucks('views', nunjucksOptions));


// Redirect all traffic not to index to index
router.redirect('/(.*)', '');

//Routes
app.use(homeRoutes.routes());

// HTTPS
var listenHttpsPort = 3001;
try {
  var serviceKey = fs.readFileSync(privateConfig.key, { encoding: 'utf8' });
  var certificate = fs.readFileSync(privateConfig.cert, { encoding: 'utf8' });
} catch (e) {
  if (e.code !== 'ENOENT') {
    throw e;
  }
}

if (certificate && serviceKey) {
  createServer(serviceKey, certificate, listenHttpsPort);
} else {
  const pem = require('pem');
  pem.createCertificate({selfSigned:true}, function(err, keys){
    fs.writeFileSync(privateConfig.key, keys.serviceKey);
    fs.writeFileSync(privateConfig.cert, keys.certificate);
    createServer(keys.serviceKey, keys.certificate, listenHttpsPort)
  });
}

//create https server using serviceKey, certificate, and port
function createServer(key, cert, port) {
  https.createServer({key: key, cert: cert}, app.callback()).listen(port);
}

app.listen(3000);
console.log('Koa listening on port 3000');