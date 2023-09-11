// Copyright Epic Games, Inc. All Rights Reserved.

import React from 'react';
import { PixelStreamingWrapper } from './PixelStreamingWrapper';

export const App = () => {
    return (
        <div
            style={{
                height: '100%',
                width: '100%'
            }}
        >
            <PixelStreamingWrapper
                initialSettings={{
                    AutoPlayVideo: true,
                    AutoConnect: true,
                    ss: 'ws://localhost:80',
                    StartVideoMuted: true,
                    HoveringMouse: true,
                    WaitForStreamer: true
                }}
            />
        </div>
    );
};
