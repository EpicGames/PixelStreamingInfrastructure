// Copyright Epic Games, Inc. All Rights Reserved.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Config,
    AllSettings,
    PixelStreaming,
    DataChannelOpenEvent
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';

export interface PixelStreamingWrapperProps {
    initialSettings?: Partial<AllSettings>;
}

export const PixelStreamingWrapper = ({
    initialSettings
}: PixelStreamingWrapperProps) => {
    // A reference to parent div element that the Pixel Streaming library attaches into:
    const videoParent = useRef<HTMLDivElement>(null);
    const urlParams = new URLSearchParams(window.location.search);

    // Pixel streaming library instance is stored into this state variable after initialization:
    const [pixelStreaming, setPixelStreaming] = useState<PixelStreaming>();
    
    // A boolean state variable that determines if the Click to play overlay is shown:
    const [clickToPlayVisible, setClickToPlayVisible] = useState(false);

    // Run on component mount:
    useEffect(() => {
        if (videoParent.current) {
            // Attach Pixel Streaming library to videoParent element:
            const config = new Config({ initialSettings });
            const streaming = new PixelStreaming(config, {
                videoElementParent: videoParent.current
            });
            
            // register a playStreamRejected handler to show Click to play overlay if needed:
            streaming.addEventListener('playStreamRejected', () => {
                setClickToPlayVisible(true);
            });

            // Save the library instance into component state so that it can be accessed later:
            setPixelStreaming(streaming);

            // Clean up on component unmount:
            return () => {
                try {
                    streaming.disconnect();
                } catch {}
            };
        }
    }, []);

    useEffect(() => {
        if (!pixelStreaming) return;
        pixelStreaming.addEventListener('dataChannelOpen', (ev) => {
            console.log(`just opened: ${ev.data.label}`, urlParams.entries());
        });
    }, [pixelStreaming]);

    const postEvent: React.MouseEventHandler<Element> = (ev) => {
        ev.preventDefault();
        console.log('button click', urlParams.entries());
        pixelStreaming.emitUIInteraction({
            type: 'authDataReceived',
            value: {
                token: urlParams.get('token'),
                joinCode: urlParams.get('joinCode'),
                room: urlParams.get('room'),
            },
        });
    }

    const Button = (...props: any[]) => (
        <div {...props} style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            cursor: 'pointer',
            color: 'rgb(138, 187, 42)',
            border: '2px solid rgb(138, 187, 42)'
        }} onClick={postEvent} >
            Post My Params
        </div>
    )
    
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
            <Button />
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
