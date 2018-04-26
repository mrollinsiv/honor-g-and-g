//We're using koa, so lets require it, (duh).
const Koa = require('koa');
const Router = require('koa-router');
const nunjucks = require('koa-nunjucks-async');
const serve = require('koa-static');
const config = require('./config/config')[process.env.NODE_ENV];
const dbConfig = require('./config/db');
const request = require('request-promise');
const https = require('https');
const fs = require('fs');
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

  if (!fundraisingData.value || fundraisingData.updated_at < Date.now() - (300 * 1000) || thankYou) {  // Update every 5 minutes
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

      fundraisingData.update({value: {donors: donations.donations.slice(0, 20).map(a => a.donorDisplayName), totalRaised: fundraiser.grandTotalRaisedExcludingGiftAid || 0}});
    } catch(error) {
      if (!fundraisingData.value) {
        // could not load
        fundraisingData.value = {donors: [], totalRaised: 0};
      }
    }
  }

  // If on thank you page, now redirect home and remove query string
  if (thankYou) {
    var expires = new Date();
    expires.setTime(expires.getTime()+(60 * 1000));
    ctx.cookies.set('thankYou', true, {
      expires: expires,
      httpOnly: false
    });
    ctx.redirect('/');
  }

  // Get race data
  let races = await Data.findOne({where: {key: 'races'}});
  if (!races) {
    races = await Data.create({key: 'races'});
  }

  var completedRaces = [],
    upcomingRaces = [];
  // Races are deemed complete at 10am EST
  races.value.forEach(function(race) {
     var raceDate = new Date(Date.parse(race.date) + (60 * 12 * 1000) + (60 * 4 * 1000));  // Make it 10am UTC and then add 4 hrs to get 10am EST
     if (raceDate < Date.now()) {
        completedRaces.push(race);
     } else {
       upcomingRaces.push(race);
     }
  });

  // Get instagram pics
  let instaPics = await Data.findOne({where: {key: 'insta_pics'}});

  await ctx.render('index', {
    donors: fundraisingData.value.donors,
    totalRaised: parseFloat(fundraisingData.value.totalRaised).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    }),
    races: {
      completedRaces: completedRaces,
      upcomingRaces: upcomingRaces
    },
    totalMiles: completedRaces ? completedRaces.reduce((a, b) => +a + +b.miles, 0) : 0,
    instaPics: instaPics.value,
    thankYou: thankYou
  });
});

// Redirect to HTTPS
app.use(async (ctx, next) => {
  if (!ctx.secure) {
    var href = ctx.href.replace('http:', 'https:').replace(':3000', ':3001');
    ctx.redirect(href);
  }
  await next();
});

// Redirect all traffic not to index to index
router.redirect('/(.*)', '');

//and we'll set up 2 routes, for our index and about me pages
app.use(router.routes());

//and then give it a port to listen for

//HTTPS
var listenHttpsPort = 3001;
try {
  var serviceKey = fs.readFileSync(config.private.key, { encoding: 'utf8' });
  var certificate = fs.readFileSync(config.private.cert, { encoding: 'utf8' });
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
    fs.writeFileSync(config.private.key, keys.serviceKey);
    fs.writeFileSync(config.private.cert, keys.certificate);
    createServer(keys.serviceKey, keys.certificate, listenHttpsPort)
  });
}

//create https server using serviceKey, certificate, and port
function createServer(key, cert, port) {
  https.createServer({key: key, cert: cert}, app.callback()).listen(port);
}

app.listen(3000);
console.log('Koa listening on port 3000');