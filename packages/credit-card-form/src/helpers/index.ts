import { CardModel } from '../form/model';

export const convertCard = (card: string) => card.replace(/ /g, '');
export const convertExpiry = (card: string) => card.replace('/', '');
export const convertModel = (model: CardModel) => ({
 ...model,
 card: convertCard(model.card),
});
