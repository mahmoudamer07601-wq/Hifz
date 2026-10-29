/* adhan-js (https://github.com/batoulapps/adhan-js), MIT License, Copyright (c) 2016 Batoul Apps: see LICENSE
   in this folder.  TypeScript types stripped for the Hifz web app (node's type stripper, 2026-10-29). */
                                                

const HighLatitudeRule = {
  MiddleOfTheNight: 'middleofthenight',
  SeventhOfTheNight: 'seventhofthenight',
  TwilightAngle: 'twilightangle',

  recommended(coordinates             ) {
    if (Math.abs(coordinates.latitude) > 48) {
      return HighLatitudeRule.SeventhOfTheNight;
    } else {
      return HighLatitudeRule.MiddleOfTheNight;
    }
  },
}         ;

export default HighLatitudeRule;
