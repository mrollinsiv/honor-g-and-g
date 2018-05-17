const Router = require('koa-router');

const HomeController = require('../controllers/HomeController');

const router = new Router();

const homeController = new HomeController();

router.get('/', async (ctx) => {
  await homeController.index(ctx);
});

module.exports = router;
