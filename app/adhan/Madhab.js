/* adhan-js (https://github.com/batoulapps/adhan-js), MIT License, Copyright (c) 2016 Batoul Apps: see LICENSE
   in this folder.  TypeScript types stripped for the Hifz web app (node's type stripper, 2026-10-29). */

export const Madhab = {
  Shafi: 'shafi',
  Hanafi: 'hanafi',
}         ;

export function shadowLength(madhab                        ) {
  switch (madhab) {
    case Madhab.Shafi:
      return 1;
    case Madhab.Hanafi:
      return 2;
    default:
      throw new Error('Invalid Madhab');
  }
}
