import { async } from '../lit-rx';
import { animationFrameScheduler } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

export function TemplateObservable(animationFrame?: boolean) {
  return (target: any, key: string) => {
    const Connect =
      target.constructor.prototype.connectedCallback || function() {};
    target.constructor.prototype.connectedCallback = function() {
      if (animationFrame) {
        this[key] = async(
          this[key].pipe(
            shareReplay({ scheduler: animationFrameScheduler, refCount: true })
          )
        );
      }
      this[key] = async(this[key]);
      return Connect.call(this);
    };
  };
}
