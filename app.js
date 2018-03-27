//We're using koa, so lets require it, (duh).
const Koa = require('koa');
const Router = require('koa-router');
const nunjucks = require('koa-nunjucks-async');
const serve = require('koa-static');
const config = require('./config/config');

//and initialize it with
const app = new Koa();
const router = new Router();

app.use(serve('./web'));

// Send config data to the FE
app.use(async (ctx,next) => {
  ctx.state.globals = config.public;
  ctx.state.instaPics = require('./data/instagram').images;
  await next();
});

const nunjucksOptions = {
  ext: '.html.twig'
};

// Load other middlewares...
// Load nunjucks last before routes
app.use(nunjucks('views', nunjucksOptions));


router.get('/', async ctx => {
  await ctx.render('index', {
    message: 'Hello World!'
  })
});

//and we'll set up 2 routes, for our index and about me pages
app.use(router.routes());

//and then give it a port to listen for
app.listen(3000);
console.log('Koa listening on port 3000');