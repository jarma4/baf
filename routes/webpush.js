var webpush = require('web-push');

require('dotenv').config();

webpush.setVapidDetails(
   "mailto:admin@2dollarbets.com",
   process.env.BAF_VAPPUB,
   process.env.BAF_VAPPRI
 );