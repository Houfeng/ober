import { ObserveConfig, ObserveMode } from '../src';

const { DN_ENV } = process.env;
console.log(`--------------- ObserveMode:${DN_ENV} ---------------`);

//@ts-ignore
ObserveConfig.mode = ObserveMode[DN_ENV];