// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from '@epicgames-ps/lib-pixelstreamingcommon-ue5.8';
import { WebRtcPlayerController } from '../WebRtcPlayer/WebRtcPlayerController';
import { XRGamepadController } from '../Inputs/XRGamepadController';
import { XrFrameEvent } from '../Util/EventEmitter';
import { Flags } from '../Config/Config';

export class WebXRController {
    private xrSession: XRSession;
    private xrRefSpace: XRReferenceSpace;
    private gl: WebGL2RenderingContext;
    private xrViewerPose: XRViewerPose = null;
    // Used for comparisons to ensure two numbers are close enough.
    private EPSILON = 0.0000001;

    private positionLocation: number;
    private texcoordLocation: number;

    private positionBuffer: WebGLBuffer;
    private texcoordBuffer: WebGLBuffer;

    private videoTexture: WebGLTexture = null;
    private prevVideoWidth: number = 0;
    private prevVideoHeight: number = 0;

    private webRtcController: WebRtcPlayerController;
    private xrGamepadController: XRGamepadController;

    private leftView: XRView = null;
    private rightView: XRView = null;

    // Store the HMD data we have last sent (not all of it is needed every frame unless it changes)
    private lastSentLeftEyeProj: Float32Array = null;
    private lastSentRightEyeProj: Float32Array = null;
    private lastSentRelativeLeftEyePos: DOMPointReadOnly = null;
    private lastSentRelativeRightEyePos: DOMPointReadOnly = null;

    onSessionStarted: EventTarget;
    onSessionEnded: EventTarget;
    onFrame: EventTarget;

    constructor(webRtcPlayerController: WebRtcPlayerController) {
        this.xrSession = null;
        this.webRtcController = webRtcPlayerController;
        this.xrGamepadController = new XRGamepadController(this.webRtcController.streamMessageController);
        this.onSessionEnded = new EventTarget();
        this.onSessionStarted = new EventTarget();
        this.onFrame = new EventTarget();
    }

    public xrClicked() {
        if (!this.xrSession) {
            if (!navigator.xr) {
                Logger.Error('This browser does not support XR.');
                return;
            }

            void navigator.xr
                /* Request immersive-vr session without any optional features. */
                .requestSession('immersive-vr', { optionalFeatures: [] })
                .then((session: XRSession) => {
                    this.onXrSessionStarted(session);
                });
        } else {
            void this.xrSession.end();
        }
    }

    onXrSessionEnded() {
        Logger.Info('XR Session ended');
        this.xrSession = null;
        this.onSessionEnded.dispatchEvent(new Event('xrSessionEnded'));
    }

    initGL() {
        if (this.gl) {
            return;
        }
        const canvas = document.createElement('canvas');
        this.gl = canvas.getContext('webgl2', {
            xrCompatible: true
        });

        // Set our clear color
        this.gl.clearColor(0.0, 0.0, 0.0, 1);
    }

    initShaders() {
        // shader source code
        const vertexShaderSource: string = `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;

        // varyings
        varying vec2 v_texCoord;

        void main() {
           gl_Position = vec4(a_position.x, a_position.y, 0, 1);
           // pass the texCoord to the fragment shader
           // The GPU will interpolate this value between points.
           v_texCoord = a_texCoord;
        }
        `;

        const fragmentShaderSource: string = `
        precision mediump float;

        // our texture
        uniform sampler2D u_image;

        // the texCoords passed in from the vertex shader.
        varying vec2 v_texCoord;

        void main() {
           gl_FragColor = texture2D(u_image, v_texCoord);
        }
        `;

        // setup vertex shader
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        this.gl.shaderSource(vertexShader, vertexShaderSource);
        this.gl.compileShader(vertexShader);

        // setup fragment shader
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        this.gl.shaderSource(fragmentShader, fragmentShaderSource);
        this.gl.compileShader(fragmentShader);

        // setup GLSL program
        const shaderProgram = this.gl.createProgram();
        this.gl.attachShader(shaderProgram, vertexShader);
        this.gl.attachShader(shaderProgram, fragmentShader);
        this.gl.linkProgram(shaderProgram);
        this.gl.useProgram(shaderProgram);

        // look up where vertex data needs to go
        this.positionLocation = this.gl.getAttribLocation(shaderProgram, 'a_position');
        this.texcoordLocation = this.gl.getAttribLocation(shaderProgram, 'a_texCoord');
    }

    updateVideoTexture() {
        if (!this.videoTexture) {
            // Create our texture that we use in our shader
            // and bind it once because we never use any other texture.
            this.videoTexture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture);

            // Set the parameters so we can render any size image.
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        }

        const videoHeight = this.webRtcController.videoPlayer.getVideoElement().videoHeight;
        const videoWidth = this.webRtcController.videoPlayer.getVideoElement().videoWidth;

        if (this.prevVideoHeight != videoHeight || this.prevVideoWidth != videoWidth) {
            // Do full update of texture if dimensions do not match
            this.gl.texImage2D(
                this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                videoWidth,
                videoHeight,
                0,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                this.webRtcController.videoPlayer.getVideoElement()
            );
        } else {
            // If dimensions match just update the sub region
            this.gl.texSubImage2D(
                this.gl.TEXTURE_2D,
                0,
                0,
                0,
                videoWidth,
                videoHeight,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                this.webRtcController.videoPlayer.getVideoElement()
            );
        }

        // Update prev video width/height
        this.prevVideoHeight = videoHeight;
        this.prevVideoWidth = videoWidth;
    }

    initBuffers() {
        // Create out position buffer and its vertex shader attribute
        {
            // Create a buffer to put the the vertices of the plane we will draw the video stream onto
            this.positionBuffer = this.gl.createBuffer();
            // Bind the position buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            // Enable `positionLocation` to be used as vertex shader attribute
            this.gl.enableVertexAttribArray(this.positionLocation);

            // Note: positions are passed in clip-space coordinates [-1..1] so no need to convert in-shader
            // prettier-ignore
            this.gl.bufferData(
                this.gl.ARRAY_BUFFER,
                new Float32Array([
                    -1.0,  1.0,
                     1.0,  1.0,
                    -1.0, -1.0,
                    -1.0, -1.0,
                     1.0,  1.0,
                     1.0, -1.0
                ]),
                this.gl.STATIC_DRAW
            );

            // Tell position attribute of the vertex shader how to get data out of the bound buffer (the positionBuffer)
            this.gl.vertexAttribPointer(
                this.positionLocation,
                2 /*size*/,
                this.gl.FLOAT /*type*/,
                false /*normalize*/,
                0 /*stride*/,
                0 /*offset*/
            );
        }

        // Create our texture coordinate buffers for accessing our texture
        {
            this.texcoordBuffer = this.gl.createBuffer();
            // Bind the texture coordinate buffer
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texcoordBuffer);
            // Enable `texcoordLocation` to be used as a vertex shader attribute
            this.gl.enableVertexAttribArray(this.texcoordLocation);

            // The texture coordinates to apply for rectangle we are drawing
            this.gl.bufferData(
                this.gl.ARRAY_BUFFER,
                new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0]),
                this.gl.STATIC_DRAW
            );

            // Tell texture coordinate attribute of the vertex shader how to get data out of the bound buffer (the texcoordBuffer)
            this.gl.vertexAttribPointer(
                this.texcoordLocation,
                2 /*size*/,
                this.gl.FLOAT /*type*/,
                false /*normalize*/,
                0 /*stride*/,
                0 /*offset*/
            );
        }
    }

    onXrSessionStarted(session: XRSession) {
        Logger.Info('XR Session started');

        this.xrSession = session;
        this.xrSession.addEventListener('end', () => {
            this.onXrSessionEnded();
        });

        // Initialization
        this.initGL();
        this.initShaders();
        this.initBuffers();

        void session.requestReferenceSpace('local').then((refSpace) => {
            this.xrRefSpace = refSpace;

            // Set up our base layer (i.e. a projection layer that fills the entire XR viewport).
            void this.xrSession.updateRenderState({
                baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
            });

            // Update target framerate to 90 fps if 90 fps is supported in this XR device
            if (this.xrSession.supportedFrameRates) {
                for (const frameRate of this.xrSession.supportedFrameRates) {
                    if (frameRate == 90) {
                        void session.updateTargetFrameRate(90);
                    }
                }
            }

            // Binding to each new frame to get latest XR updates
            this.xrSession.requestAnimationFrame(this.onXrFrame.bind(this));
        });

        this.onSessionStarted.dispatchEvent(new Event('xrSessionStarted'));
    }

    areArraysEqual(a: Float32Array, b: Float32Array): boolean {
        return (
            a.length === b.length && a.every((element, index) => Math.abs(element - b[index]) <= this.EPSILON)
        );
    }

    arePointsEqual(a: DOMPointReadOnly, b: DOMPointReadOnly): boolean {
        return (
            Math.abs(a.x - b.x) >= this.EPSILON &&
            Math.abs(a.y - b.y) >= this.EPSILON &&
            Math.abs(a.z - b.z) >= this.EPSILON
        );
    }

    sendXRDataToUE() {
        if (this.leftView == null || this.rightView == null) {
            return;
        }

        // We selectively send either the `XREyeViews` or `XRHMDTransform`
        // messages over the datachannel. The reason for this selective sending is that
        // the `XREyeViews` is a much larger message and changes infrequently (e.g. only when user changes headset IPD).
        // Therefore, we only need to send it once on startup and then any time it changes.
        // The rest of the time we can send the `XRHMDTransform` message.
        let shouldSendEyeViews =
            this.lastSentLeftEyeProj == null ||
            this.lastSentRightEyeProj == null ||
            this.lastSentRelativeLeftEyePos == null ||
            this.lastSentRelativeRightEyePos == null;

        const leftEyeTrans = this.leftView.transform.matrix;
        const leftEyeProj = this.leftView.projectionMatrix;
        const rightEyeTrans = this.rightView.transform.matrix;
        const rightEyeProj = this.rightView.projectionMatrix;
        const hmdTrans = this.xrViewerPose.transform.matrix;

        // Check if projection matrices have changed
        if (!shouldSendEyeViews && this.lastSentLeftEyeProj != null && this.lastSentRightEyeProj != null) {
            const leftEyeProjUnchanged = this.areArraysEqual(leftEyeProj, this.lastSentLeftEyeProj);
            const rightEyeProjUnchanged = this.areArraysEqual(rightEyeProj, this.lastSentRightEyeProj);
            shouldSendEyeViews = leftEyeProjUnchanged == false || rightEyeProjUnchanged == false;
        }

        const leftEyeRelativePos = new DOMPointReadOnly(
            this.leftView.transform.position.x - this.xrViewerPose.transform.position.x,
            this.leftView.transform.position.y - this.xrViewerPose.transform.position.y,
            this.leftView.transform.position.z - this.xrViewerPose.transform.position.z,
            1.0
        );

        const rightEyeRelativePos = new DOMPointReadOnly(
            this.leftView.transform.position.x - this.xrViewerPose.transform.position.x,
            this.leftView.transform.position.y - this.xrViewerPose.transform.position.y,
            this.leftView.transform.position.z - this.xrViewerPose.transform.position.z,
            1.0
        );

        // Check if relative eye pos has changed (e.g IPD changed)
        if (
            !shouldSendEyeViews &&
            this.lastSentRelativeLeftEyePos != null &&
            this.lastSentRelativeRightEyePos != null
        ) {
            const leftEyePosUnchanged = this.arePointsEqual(
                leftEyeRelativePos,
                this.lastSentRelativeLeftEyePos
            );
            const rightEyePosUnchanged = this.arePointsEqual(
                rightEyeRelativePos,
                this.lastSentRelativeRightEyePos
            );
            shouldSendEyeViews = leftEyePosUnchanged == false || rightEyePosUnchanged == false;
            // Note: We are not checking if EyeView rotation changes (as far as I know no HMD supports changing this value at runtime).
        }

        if (shouldSendEyeViews) {
            // send transform (4x4) and projection matrix (4x4) data for each eye (left first, then right)
            // prettier-ignore
            this.webRtcController.streamMessageController.toStreamerHandlers.get('XREyeViews')([
                // Left eye 4x4 transform matrix
                leftEyeTrans[0], leftEyeTrans[4], leftEyeTrans[8],  leftEyeTrans[12],
                leftEyeTrans[1], leftEyeTrans[5], leftEyeTrans[9],  leftEyeTrans[13],
                leftEyeTrans[2], leftEyeTrans[6], leftEyeTrans[10], leftEyeTrans[14],
                leftEyeTrans[3], leftEyeTrans[7], leftEyeTrans[11], leftEyeTrans[15],
                // Left eye 4x4 projection matrix
                leftEyeProj[0], leftEyeProj[4], leftEyeProj[8],  leftEyeProj[12],
                leftEyeProj[1], leftEyeProj[5], leftEyeProj[9],  leftEyeProj[13],
                leftEyeProj[2], leftEyeProj[6], leftEyeProj[10], leftEyeProj[14],
                leftEyeProj[3], leftEyeProj[7], leftEyeProj[11], leftEyeProj[15],
                // Right eye 4x4 transform matrix
                rightEyeTrans[0], rightEyeTrans[4], rightEyeTrans[8],  rightEyeTrans[12],
                rightEyeTrans[1], rightEyeTrans[5], rightEyeTrans[9],  rightEyeTrans[13],
                rightEyeTrans[2], rightEyeTrans[6], rightEyeTrans[10], rightEyeTrans[14],
                rightEyeTrans[3], rightEyeTrans[7], rightEyeTrans[11], rightEyeTrans[15],
                // right eye 4x4 projection matrix
                rightEyeProj[0], rightEyeProj[4], rightEyeProj[8],  rightEyeProj[12],
                rightEyeProj[1], rightEyeProj[5], rightEyeProj[9],  rightEyeProj[13],
                rightEyeProj[2], rightEyeProj[6], rightEyeProj[10], rightEyeProj[14],
                rightEyeProj[3], rightEyeProj[7], rightEyeProj[11], rightEyeProj[15],
                // HMD 4x4 transform
                hmdTrans[0], hmdTrans[4], hmdTrans[8],  hmdTrans[12],
                hmdTrans[1], hmdTrans[5], hmdTrans[9],  hmdTrans[13],
                hmdTrans[2], hmdTrans[6], hmdTrans[10], hmdTrans[14],
                hmdTrans[3], hmdTrans[7], hmdTrans[11], hmdTrans[15],
            ]);
            this.lastSentLeftEyeProj = leftEyeProj;
            this.lastSentRightEyeProj = rightEyeProj;
            this.lastSentRelativeLeftEyePos = leftEyeRelativePos;
            this.lastSentRelativeRightEyePos = rightEyeRelativePos;
        } else {
            // If we don't need to the entire eye views being sent just send the HMD transform
            this.webRtcController.streamMessageController.toStreamerHandlers.get('XRHMDTransform')([
                // HMD 4x4 transform
                hmdTrans[0],
                hmdTrans[4],
                hmdTrans[8],
                hmdTrans[12],
                hmdTrans[1],
                hmdTrans[5],
                hmdTrans[9],
                hmdTrans[13],
                hmdTrans[2],
                hmdTrans[6],
                hmdTrans[10],
                hmdTrans[14],
                hmdTrans[3],
                hmdTrans[7],
                hmdTrans[11],
                hmdTrans[15]
            ]);
        }
    }

    onXrFrame(time: DOMHighResTimeStamp, frame: XRFrame) {
        this.xrViewerPose = frame.getViewerPose(this.xrRefSpace);
        if (this.xrViewerPose) {
            this.updateViews();
            if (this.leftView == null || this.rightView == null) {
                return;
            }

            this.sendXRDataToUE();
            this.updateVideoTexture();
            this.render();
        }

        if (this.webRtcController.config.isFlagEnabled(Flags.XRControllerInput)) {
            this.xrSession.inputSources.forEach(
                (source: XRInputSource, _index: number, _array: XRInputSource[]) => {
                    this.xrGamepadController.updateStatus(source, frame, this.xrRefSpace);
                },
                this
            );
        }

        this.xrSession.requestAnimationFrame((time: DOMHighResTimeStamp, frame: XRFrame) =>
            this.onXrFrame(time, frame)
        );

        this.onFrame.dispatchEvent(new XrFrameEvent({ time, frame }));
    }

    private updateViews() {
        if (!this.xrViewerPose) {
            return;
        }
        for (const view of this.xrViewerPose.views) {
            if (view.eye === 'left') {
                this.leftView = view;
            } else if (view.eye === 'right') {
                this.rightView = view;
            }
        }
    }

    private render() {
        if (!this.gl) {
            return;
        }

        // Bind the framebuffer to the base layer's framebuffer
        const glLayer = this.xrSession.renderState.baseLayer;
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);

        // Set the relevant portion of clip space
        this.gl.viewport(0, 0, glLayer.framebufferWidth, glLayer.framebufferHeight);

        // Draw the rectangle we will show the video stream texture on
        this.gl.drawArrays(this.gl.TRIANGLES /*primitiveType*/, 0 /*offset*/, 6 /*count*/);
    }

    static isSessionSupported(mode: XRSessionMode): Promise<boolean> {
        if (location.protocol !== 'https:') {
            Logger.Info('WebXR requires https, if you want WebXR use https.');
        }

        // Wrap in try-catch because access to XR object can be denied due
        // to browser security permissions (e.g. streaming from an iframe)
        try {
            if (navigator.xr) {
                return navigator.xr.isSessionSupported(mode);
            }
        } catch {
            return Promise.resolve(false);
        }

        return Promise.resolve(false);
    }
}
