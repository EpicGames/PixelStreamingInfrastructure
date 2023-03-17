import React, { useEffect, useRef, useState } from 'react';
import {
    Config,
    AllSettings,
    PixelStreaming
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';

export interface PixelStreamingWrapperProps {
    initialSettings?: Partial<AllSettings>;
}

export const PixelStreamingWrapper = ({
    initialSettings
}: PixelStreamingWrapperProps) => {
    const videoParent = useRef<HTMLDivElement>(null);

    const [pixelStreaming, setPixelStreaming] = useState<PixelStreaming>();
    const [clickToPlayVisible, setClickToPlayVisible] = useState(false);

    useEffect(() => {
        if (videoParent.current) {
            const config = new Config({ initialSettings });
            const streaming = new PixelStreaming(config, {
                videoElementParent: videoParent.current
            });
            streaming.addEventListener('playStreamRejected', () => {
                setClickToPlayVisible(true);
            });

            setPixelStreaming(streaming);
            return () => {
                try {
                    streaming.disconnect();
                } catch {}
            };
        }
    }, []);

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                position: 'relative'
            }}
        >
            <div
                style={{
                    width: '100%',
                    height: '100%'
                }}
                ref={videoParent}
            />
            {clickToPlayVisible && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        pixelStreaming?.play();
                        setClickToPlayVisible(false);
                    }}
                >
                    <div>Click to play</div>
                </div>
            )}
        </div>
    );
};
