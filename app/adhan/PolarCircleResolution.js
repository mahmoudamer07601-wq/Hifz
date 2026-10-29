/* adhan-js (https://github.com/batoulapps/adhan-js), MIT License, Copyright (c) 2016 Batoul Apps: see LICENSE
   in this folder.  TypeScript types stripped for the Hifz web app (node's type stripper, 2026-10-29). */
import Coordinates from './Coordinates.js';
                                                                    
import { computePrayerTimesForDay, shiftPrayerTimesByDays } from './PrayerTimesCalculation.js';
                                                                     

export const PolarCircleResolution = {
  AqrabBalad: 'AqrabBalad',
  AqrabYaum: 'AqrabYaum',
  Unresolved: 'Unresolved',
}         ;

const LATITUDE_VARIATION_STEP = 0.5; // Degrees to add/remove at each resolution step

const aqrabYaumResolver = (
  coordinates             ,
  date      ,
  calculationParameters                       ,
  daysAdded = 1,
  direction = 1,
)                           => {
  if (daysAdded > Math.ceil(365 / 2)) {
    return null;
  }

  const testDate = new Date(date.getTime());
  testDate.setDate(testDate.getDate() + direction * daysAdded);

  const result = computePrayerTimesForDay(
    coordinates,
    testDate,
    calculationParameters,
  );
  if (!result.isValid) {
    return aqrabYaumResolver(
      coordinates,
      date,
      calculationParameters,
      daysAdded + (direction > 0 ? 0 : 1),
      -direction,
    );
  }

  // testDate is direction*daysAdded days from date; shift back by that
  // amount to relabel the candidate day's times onto the requested date.
  return shiftPrayerTimesByDays(result, -(direction * daysAdded));
};

const aqrabBaladResolver = (
  coordinates             ,
  date      ,
  latitude        ,
  calculationParameters                       ,
)                           => {
  const candidateCoordinates = new Coordinates(latitude, coordinates.longitude);
  const result = computePrayerTimesForDay(
    candidateCoordinates,
    date,
    calculationParameters,
  );

  if (!result.isValid) {
    // The equator is the terminal search value: moving past it would flip
    // into the other hemisphere, which has the wrong season's solar
    // geometry for the requested date.
    if (latitude === 0) {
      return null;
    }

    const nextLatitude =
      Math.sign(latitude) *
      Math.max(0, Math.abs(latitude) - LATITUDE_VARIATION_STEP);
    return aqrabBaladResolver(
      coordinates,
      date,
      nextLatitude,
      calculationParameters,
    );
  }

  return result;
};

export const resolvePolarCircle = (
  resolver                                       ,
  coordinates             ,
  date      ,
  calculationParameters                       ,
)                           => {
  switch (resolver) {
    case PolarCircleResolution.AqrabYaum: {
      return aqrabYaumResolver(coordinates, date, calculationParameters);
    }
    case PolarCircleResolution.AqrabBalad: {
      const { latitude } = coordinates;
      return aqrabBaladResolver(
        coordinates,
        date,
        latitude - Math.sign(latitude) * LATITUDE_VARIATION_STEP,
        calculationParameters,
      );
    }
    default: {
      return null;
    }
  }
};
