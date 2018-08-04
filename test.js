let sports = {
   nfl: {
      start: new Date(2017,8,5),
      inseason: false
   },
   nba: {
      start: new Date(2017,9,17),
      inseason: false
   },
   ncaa: {
      start: new Date(2018,2,16),
      inseason: true
   },
   fifa: {
      start: new Date(2018,5,14),
      inseason: true
   }
};

for (let sport in sports){
   if (sports[sport].inseason)
      console.log(`${sport} is in season`);
}