//We're using koa, so lets require it, (duh).
var Koa = require('koa');
var Router = require('koa-router');
var nunjucks = require('koa-nunjucks-async');
var serve = require('koa-static');

//and initialize it with
const app = new Koa();
const router = new Router();

app.use(serve('./web'));

app.use(async (ctx,next) => {
  ctx.state.globals = require('./config/config');
  ctx.state.instaPics = require('./data/instagram').images;
  console.log(ctx.state);
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