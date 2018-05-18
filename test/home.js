const should = require('should');
const HomeController = require('../controllers/HomeController');

// Constants
const publicConfig = require('../config/globals')[process.env.NODE_ENV];
const privateConfig = require('../config/private');

describe('Home Controller', () => {
  it('load race data', async () => {
    const raceData = await HomeController.getRaceData();
    should(raceData).have.property('totalMiles');
    should(raceData).have.property('completedRaces');
    should(raceData).have.property('upcomingRaces');
  });

  it('load fundraising data from API', async () => {
    const fundraisingData = await HomeController.getFundraisingData({
      state: {
        globals: {
          public: publicConfig,
          private: privateConfig,
        },
      },
    }, true);
    should(fundraisingData).have.propertyByPath('value', 'donors');
    should(fundraisingData).have.propertyByPath('value', 'totalRaised');
  }).timeout(6000);

  it('load fundraising data from DB', async () => {
    const fundraisingData = await HomeController.getFundraisingData({
      state: {
        globals: {
          public: publicConfig,
          private: privateConfig,
        },
      },
    });
    should(fundraisingData).have.propertyByPath('value', 'donors');
    should(fundraisingData).have.propertyByPath('value', 'totalRaised');
  });
});

