import { ObserveConfig } from '../src';

const { DN_ENV } = process.env;
console.log(`--------------- ObserveMode:${DN_ENV} ---------------`);

//@ts-ignore
ObserveConfig.mode = DN_ENV;