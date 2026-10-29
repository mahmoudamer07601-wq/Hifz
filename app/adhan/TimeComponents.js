/* adhan-js (https://github.com/batoulapps/adhan-js), MIT License, Copyright (c) 2016 Batoul Apps: see LICENSE
   in this folder.  TypeScript types stripped for the Hifz web app (node's type stripper, 2026-10-29). */
export default class TimeComponents {
  hours        ;
  minutes        ;
  seconds        ;

  constructor(num        ) {
    this.hours = Math.floor(num);
    this.minutes = Math.floor((num - this.hours) * 60);
    this.seconds = Math.floor(
      (num - (this.hours + this.minutes / 60)) * 60 * 60,
    );
    return this;
  }

  utcDate(year        , month        , date        )       {
    return new Date(
      Date.UTC(year, month, date, this.hours, this.minutes, this.seconds),
    );
  }
}
