//We're using koa, so lets require it, (duh).
const Koa = require('koa');
const Router = require('koa-router');
const nunjucks = require('koa-nunjucks-async');
const serve = require('koa-static');
const config = require('./config/config');
const dbConfig = require('./config/db');
const request = require('request-promise');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(dbConfig.database, dbConfig.user, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.adapter,
  logging: false
});

const Data = sequelize.define('data', {
  id:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key:{
    type: Sequelize.TEXT,
    allowNull: false
  },
  value: {
    type: Sequelize.JSONB
  }
}, {
  timestamps: true,
  freezeTableName: true,
  tableName: 'data',
  underscored: true
});

sequelize.sync();

//and initialize it with
const app = new Koa();
const router = new Router();

app.use(serve('./web'));

// Send config data to the FE
app.use(async (ctx,next) => {
  ctx.state.globals = config.public;
  await next();
});

const nunjucksOptions = {
  ext: '.html.twig'
};

// Load other middlewares...
// Load nunjucks last before routes
app.use(nunjucks('views', nunjucksOptions));


router.get('/', async ctx => {
  let thankYou = typeof ctx.request.query.tyfyd !== 'undefined' && ctx.request.query.tyfyd == 1 ? true : false; // Flag if on response page, update donations

  // Get fundraising data
  let fundraisingData = await Data.findOne({where: {key: 'fundraising_data'}});
  if (!fundraisingData) {
    fundraisingData = await Data.create({key: 'fundraising_data'});
  }
  if (!fundraisingData.value || fundraisingData.updated_at < Date.now() - (24 * 3600 * 1000) || thankYou) {
    // Load data from JustGiving API
    let donationOptions = {
      uri: config.private.justGiving.uri + 'fundraising/pages/' + config.private.justGiving.shortname + '/donations',
      headers: {
        'Content-type': 'application/json',
        'x-api-key': config.private.justGiving.apiKey
      },
      json: true
    };

    let fundraiserOptions = {
      uri: config.private.justGiving.uri + 'fundraising/pages/' + config.private.justGiving.shortname,
      headers: {
        'Content-type': 'application/json',
        'x-api-key': config.private.justGiving.apiKey
      },
      json: true
    };

    let donations = {};
    let fundraiser = {};
    try {
      donations = await request(donationOptions);
      fundraiser = await request(fundraiserOptions);

      // Loop over data and convert GBP to USD
      for (donation in donations) {
        if (donation.donorLocalCurrencyCode == 'GBP') {
          donation.usdAmount = parseFloat(donation.amount) * 1.41;
        }
        else {
          donation.usdAmount = donation.amount;
        }
      }
      fundraisingData.update({value: {donations: donations.donations.slice(0, 20), totalRaised: fundraiser.grandTotalRaisedExcludingGiftAid || 0}});
    } catch(error) {
      if (!fundraisingData.value) {
        // could not load
        donations = {donations: []};
        fundraiser = {};
      }
    }
  }

  // Get race data
  let races = await Data.findOne({where: {key: 'races'}});
  if (!races) {
    races = await Data.create({key: 'races'});
  }

  // Get instagram pics
  let instaPics = await Data.findOne({where: {key: 'insta_pics'}});

  await ctx.render('index', {
    donations: fundraisingData.value.donations,
    totalRaised: parseInt(fundraisingData.value.totalRaised).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    }).split('.')[0],
    races: races.value,
    totalMiles: races.value.reduce((a, b) => +a + +b.miles, 0),
    instaPics: instaPics.value,
    thankYou: typeof ctx.request.query.ty !== 'undefined' && ctx.request.query.ty == 1 ? true : false
  });
});
// Redirect all traffic not to index to index
router.redirect('/(.*)', '');

//and we'll set up 2 routes, for our index and about me pages
app.use(router.routes());

//and then give it a port to listen for
app.listen(3000);
console.log('Koa listening on port 3000');