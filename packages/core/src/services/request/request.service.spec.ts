import { Container } from '../../container/Container';
import { RequestService } from './request.service';
import 'jest';

const requestService = Container.get(RequestService);

describe('Service: Request', () => {
    it('Should create request service instance', () => {
        expect(requestService).toBeDefined();
        expect(requestService.get).toBeDefined();
    });
});
