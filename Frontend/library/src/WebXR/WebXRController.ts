// Copyright Epic Games, Inc. All Rights Reserved.

import { Logger } from "../Logger/Logger";
import { WebRtcPlayerController } from "../pixelstreamingfrontend";
import { WebGLUtils } from '../Util/WebGLUtils';
import { Controller } from '../Inputs/GamepadTypes';
import { XRGamepadController } from '../Inputs/XRGamepadController';

export class WebXRController {
	xrSession: XRSession;
	xrRefSpace: XRReferenceSpace;
	gl: WebGL2RenderingContext;

	positionLocation: number;
	texcoordLocation: number;
	resolutionLocation: WebGLUniformLocation;
	offsetLocation: WebGLUniformLocation;

	positionBuffer: WebGLBuffer;
	texcoordBuffer: WebGLBuffer;

	webRtcController: WebRtcPlayerController;
	xrGamepadController: XRGamepadController;
	xrControllers: Array<Controller>;

	constructor(webRtcPlayerController: WebRtcPlayerController) {
		this.xrSession = null;
		this.webRtcController = webRtcPlayerController;
		this.xrControllers = [];
		this.xrGamepadController = new XRGamepadController(this.webRtcController.streamMessageController);
	}

	public xrClicked() {
		if(!this.xrSession) {
			navigator.xr.requestSession('immersive-vr').then((session: XRSession) => { this.onXrSessionStarted(session) })
		} else {
			this.xrSession.end();
		}
	}

	onXrSessionEnded() {
		Logger.Log(Logger.GetStackTrace(), "XR Session ended");
		this.xrSession = null;
	}

	onXrSessionStarted(session: XRSession) {
		Logger.Log(Logger.GetStackTrace(), "XR Session started");

		this.xrSession = session;
		this.xrSession.addEventListener('end', () => { this.onXrSessionEnded() });

		const canvas = document.createElement('canvas');
		this.gl = canvas.getContext('webgl2', {
			xrCompatible: true
		});

		this.xrSession.updateRenderState({
			baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
		});
	
		// setup vertex shader
		const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
		this.gl.shaderSource(vertexShader, WebGLUtils.vertexShader());
		this.gl.compileShader(vertexShader);

		// setup fragment shader
		const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
		this.gl.shaderSource(fragmentShader, WebGLUtils.fragmentShader());
		this.gl.compileShader(fragmentShader);

		// setup GLSL program
		const shaderProgram = this.gl.createProgram();
		this.gl.attachShader(shaderProgram, vertexShader);
		this.gl.attachShader(shaderProgram, fragmentShader);
		this.gl.linkProgram(shaderProgram);
		this.gl.useProgram(shaderProgram);

		// look up where vertex data needs to go
		this.positionLocation = this.gl.getAttribLocation(shaderProgram, "a_position");
		this.texcoordLocation = this.gl.getAttribLocation(shaderProgram, "a_texCoord");
		// Create a buffer to put three 2d clip space points in
		this.positionBuffer = this.gl.createBuffer();
		// Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)

		// Turn on the position attribute
		this.gl.enableVertexAttribArray(this.positionLocation);
		// Create a texture.
		const texture = this.gl.createTexture();
		this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
		// Set the parameters so we can render any size image.
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
		this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

		this.texcoordBuffer = this.gl.createBuffer();
		// lookup uniforms
		this.resolutionLocation = this.gl.getUniformLocation(shaderProgram, "u_resolution");
		this.offsetLocation = this.gl.getUniformLocation(shaderProgram, "u_offset");

		session.requestReferenceSpace('local').then((refSpace) => {
			this.xrRefSpace = refSpace;
			this.xrSession.requestAnimationFrame((time: DOMHighResTimeStamp, frame: XRFrame) => this.onXrFrame(time, frame));
		})
	}

	onXrFrame(time: DOMHighResTimeStamp, frame: XRFrame) {
		const pose = frame.getViewerPose(this.xrRefSpace);
		if(pose) {
			const matrix = pose.transform.matrix;
			const mat = [];
			for (let i = 0; i < 16; i++) {
				mat[i] = new Float32Array([matrix[i]])[0]
			}

			this.webRtcController.streamMessageController.toStreamerHandlers.get("XRHMDTransform")(
				[
				mat[0], mat[4], mat[8], mat[12],
				mat[1], mat[5], mat[9], mat[13],
				mat[2], mat[6], mat[10], mat[14],
				mat[3], mat[7], mat[11], mat[15]
				]
			)


			const glLayer = this.xrSession.renderState.baseLayer;
			// If we do have a valid pose, bind the WebGL layer's framebuffer,
			// which is where any content to be displayed on the XRDevice must be
			// rendered.
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);

			// Upload the image into the texture. WebGL knows how to extract the current frame from the video element
			this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.webRtcController.videoPlayer.getVideoElement());
			this.render(this.webRtcController.videoPlayer.getVideoElement());
		}

		this.xrSession.inputSources.forEach((source: XRInputSource, index: number, array: XRInputSource[]) => {
			this.xrGamepadController.updateStatus(source, frame, this.xrRefSpace);
		}, this);

		this.xrSession.requestAnimationFrame((time: DOMHighResTimeStamp, frame: XRFrame) => this.onXrFrame(time, frame))
	}

	private render(videoElement: HTMLVideoElement) {
		// TODO
	}


	static isSessionSupported(mode: XRSessionMode): Promise<boolean> {
		return navigator.xr.isSessionSupported(mode);
	}
}