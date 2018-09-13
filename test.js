const Scraper = require('./models/scraper');

// require('dotenv').config();

// mongoose.connect('mongodb://baf:'+process.env.BAF_MONGO+'@127.0.0.1/baf');

// Scraper.addNflGames(2,17,2018);

let list = {
   jarma: 4,
   john: 2,
   sergio: 1
};

for(let i = 1; i < list.jarma; i++){
   setTimeout(function(){
      if (list.jarma)
         console.log('jarma');
      list.jarma = 0;
   }, 500);
}