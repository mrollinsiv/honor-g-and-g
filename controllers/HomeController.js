const request = require('request-promise');
const db = require('../db/db');

class HomeController {
  async index(ctx) {
    let thankYou = typeof ctx.request.query.tyfyd !== 'undefined' && ctx.request.query.tyfyd == 1 ? true : false; // Flag if on response page, update donations

    // Load the fundraising data from DB or refresh from API
    let fundraisingData = await this.getFundraisingData(ctx, thankYou);

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

    // Load race data from DB
    let raceData = await this.getRaceData();

    // Get Instagram pics
    let instaPics = await db.Data.findOne({where: {key: 'insta_pics'}});

    await ctx.render('index', {
      donors: fundraisingData.value.donors,
      totalRaised: parseFloat(fundraisingData.value.totalRaised).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      }),
      races: {
        completedRaces: raceData.completedRaces,
        upcomingRaces: raceData.upcomingRaces
      },
      totalMiles: raceData.totalMiles.miles.toFixed(1),
      instaPics: instaPics.value,
      thankYou: thankYou
    });
  }

  // Helpers
  async getRaceData() {
    // Get race data
    let races = await db.Data.findOne({where: {key: 'races'}});
    if (!races) {
      races = await db.Data.create({key: 'races'});
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

    // Reduce the completed races to generate the total mileage
    let totalMiles = completedRaces ? completedRaces.reduce(function(a, b) {
      return {"miles": a.miles + b.miles};
    }): 0;

    return {
      completedRaces: completedRaces,
      upcomingRaces: upcomingRaces,
      totalMiles: totalMiles
    }
  }

  async getFundraisingData(ctx, thankYou) {
    // Get fundraising data
    let fundraisingData = await db.Data.findOne({where: {key: 'fundraising_data'}});
    if (!fundraisingData) {
      fundraisingData = await data.Data.create({key: 'fundraising_data'});
    }

    // Check if we need fresh data from JustGiving API
    if (!fundraisingData.value || fundraisingData.updated_at < Date.now() - (300 * 1000) || thankYou) {  // Update every 5 minutes
      // Load data from JustGiving API
      let donationOptions = {
        uri: ctx.state.globals.public.justGiving.uri + 'fundraising/pages/' + ctx.state.globals.public.justGiving.shortname + '/donations',
        headers: {
          'Content-type': 'application/json',
          'x-api-key': ctx.state.globals.private.justGiving.apiKey
        },
        json: true
      };

      let fundraiserOptions = {
        uri: ctx.state.globals.public.justGiving.uri + 'fundraising/pages/' + ctx.state.globals.public.justGiving.shortname,
        headers: {
          'Content-type': 'application/json',
          'x-api-key': ctx.state.globals.private.justGiving.apiKey
        },
        json: true
      };

      let donations = {};
      let fundraiser = {};

      // Try and get API data, otherwise fallback to old Data or empty {}
      try {
        donations = await request(donationOptions);
        fundraiser = await request(fundraiserOptions);

        fundraisingData.update({
          value: {
            donors: donations.donations.slice(0, 20).map(a => a.donorDisplayName),
            totalRaised: fundraiser.grandTotalRaisedExcludingGiftAid || 0
          }
        });
      } catch(error) {
        if (!fundraisingData.value) {
          // could not load
          fundraisingData.value = {
            donors: [],
            totalRaised: 0}
          ;
        }
      }
    }

    return fundraisingData;
  }
}

module.exports = HomeController;