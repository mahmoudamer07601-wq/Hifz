/* adhan-js (https://github.com/batoulapps/adhan-js), MIT License, Copyright (c) 2016 Batoul Apps: see LICENSE
   in this folder.  TypeScript types stripped for the Hifz web app (node's type stripper, 2026-10-29). */
import { Madhab } from './Madhab.js';
import HighLatitudeRule from './HighLatitudeRule.js';
import { PolarCircleResolution } from './PolarCircleResolution.js';
import { Rounding } from './Rounding.js';
import { Shafaq } from './Shafaq.js';
export default class CalculationParameters {
    method;
    fajrAngle;
    ishaAngle;
    ishaInterval;
    maghribAngle;
    madhab = Madhab.Shafi;
    highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
    adjustments = {
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    };
    methodAdjustments = {
        fajr: 0,
        sunrise: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
    };
    polarCircleResolution = PolarCircleResolution.AqrabBalad;
    rounding = Rounding.Nearest;
    shafaq = Shafaq.General;
    constructor(method, fajrAngle = 0, ishaAngle = 0, ishaInterval = 0, maghribAngle = 0){
        this.method = method;
        this.fajrAngle = fajrAngle;
        this.ishaAngle = ishaAngle;
        this.ishaInterval = ishaInterval;
        this.maghribAngle = maghribAngle;
        if (this.method === null) {
            this.method = 'Other';
        }
    }
    nightPortions() {
        switch(this.highLatitudeRule){
            case HighLatitudeRule.MiddleOfTheNight:
                return {
                    fajr: 1 / 2,
                    isha: 1 / 2
                };
            case HighLatitudeRule.SeventhOfTheNight:
                return {
                    fajr: 1 / 7,
                    isha: 1 / 7
                };
            case HighLatitudeRule.TwilightAngle:
                return {
                    fajr: this.fajrAngle / 60,
                    isha: this.ishaAngle / 60
                };
            default:
                throw new Error(`Invalid high latitude rule found when attempting to compute night portions: ${this.highLatitudeRule}`);
        }
    }
}
