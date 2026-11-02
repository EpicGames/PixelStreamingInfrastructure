import { Config, ControlSchemeType } from '../Config/Config';
import { StreamMessageController } from '../UeInstanceMessage/StreamMessageController';
import { InputCoordTranslator } from '../Util/InputCoordTranslator';
import { VideoPlayer } from '../VideoPlayer/VideoPlayer';
import { InputClassesFactory } from './InputClassesFactory';

describe('InputClassesFactory', () => {
    it.each([
        [undefined, undefined],
        [{} as VideoPlayer, undefined],
        [undefined, {} as InputCoordTranslator]
    ])(
        'does not create pointer controllers with incomplete media dependencies (case %#)',
        (videoPlayer, coordinateConverter) => {
            const factory = new InputClassesFactory(
                new StreamMessageController(),
                videoPlayer,
                coordinateConverter
            );
            const config = {} as Config;

            expect(factory.registerMouse(ControlSchemeType.HoveringMouse, config)).toBeUndefined();
            expect(factory.registerTouch(false)).toBeUndefined();
        }
    );
});