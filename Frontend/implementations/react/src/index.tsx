// Copyright Epic Games, Inc. All Rights Reserved.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

document.body.onload = function () {
    // Attach the React app root component to document.body
    createRoot(document.body).render(<App />);
};
