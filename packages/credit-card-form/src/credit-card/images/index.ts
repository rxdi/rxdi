import { AmericanExpress } from './american-express';
import { Diners } from './diners';
import { Discover } from './discover';
import { JSB } from './jcb';
import { Maesto } from './maestrocard';
import { Mastercard } from './mastercard';
import { UnionPay } from './union-pay';
import { Visa } from './visa';

export * from './american-express';
export * from './diners';
export * from './discover';
export * from './jcb';
export * from './maestrocard';
export * from './mastercard';
export * from './union-pay';
export * from './visa';

export const CardTypes = {
 visa: Visa,
 mastercard: Mastercard,
 'american-express': AmericanExpress,
 'diners-club': Diners,
 discover: Discover,
 jcb: JSB,
 unionpay: UnionPay,
 maestro: Maesto,
 elo: null,
 mir: null,
 hiper: null,
 hipercard: null,
};
