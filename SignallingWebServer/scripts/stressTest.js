// Copyright Epic Games, Inc. All Rights Reserved.

// This is the entrypoint to the stress test, all setup happens here
function stressTest() {


    // This stress test creates a number of Pixel Streaming pages on the same page
    // using iframes and then tries to auto-connect them.

    // The purpose of the stress test is to automate testing a large number of peers
    // connecting and disconnecting regularly from a single Unreal Engine streaming instance.

    let self = this;
    this.play = true;
    this.maxPeers = 2;
    this.totalStreams = 0;
    this.streamCreationIntervalMs = 200;
    this.streamDeletionIntervalMs = 2000;
    this.pixelStreamingFrames = [];
    this.creationIntervalHandle = null;
    this.deletionIntervalHandle = null;

    // Create a container to put the "Pixel Streaming" pages in.
    let streamsContainer = document.getElementById("streamsContainer");

    function startStressTest() {
        setupNumPeersSlider();
        startStreamCreation();
        startStreamDeletion();
        setupPlayPause();

        document.getElementById("creationIntervalInput").addEventListener("change", function(){
            self.streamCreationIntervalMs = document.getElementById("creationIntervalInput").value * 1000.0;
            startStreamCreation();
        });

        document.getElementById("deletionIntervalInput").addEventListener("change", function(){
            self.streamDeletionIntervalMs = document.getElementById("deletionIntervalInput").value * 1000.0;
            startStreamDeletion();
        });
    }

    function startStreamCreation() {

        if(self.creationIntervalHandle) {
            clearInterval(self.creationIntervalHandle);
        }

        // Create iframes of Pixel Streaming as a given interval (up to the max nPeers)
        self.creationIntervalHandle = setInterval(function(){
            
            if(self.play) {
                let curNPeers = self.pixelStreamingFrames.length;
                if(curNPeers >= self.maxPeers) {
                    return;
                }

                // Make a random amount of peers between 0 and up to max peers.
                let maxPeersToCreate = self.maxPeers - curNPeers;
                let nPeersToCreate = Math.ceil(Math.random() * maxPeersToCreate);

                for(let i = 0; i < nPeersToCreate; i++) {
                    let frame = createPixelStreamingFrame();
                    let n = self.pixelStreamingFrames.length;
                    frame.id = "PixelStreamingFrame_" + (n + 1);
                    streamsContainer.append(frame);
                    self.pixelStreamingFrames.push(frame);
                    self.totalStreams += 1;
                    updateTotalStreams();
                }   
            }
        }, self.streamCreationIntervalMs);
    }

    function startStreamDeletion() {

        if(self.deletionIntervalHandle) {
            clearInterval(self.deletionIntervalHandle);
        }

        self.deletionIntervalHandle = setInterval(function(){
            if(self.play) {
                let curNPeers = self.pixelStreamingFrames.length;
                if(curNPeers == 0) {
                    return;
                }

                // Delete a random amount of peers up to current number of peers
                let nPeersToDelete = Math.ceil(Math.random() * curNPeers);

                for(let i = 0; i < nPeersToDelete; i++) {
                    let frame = self.pixelStreamingFrames.shift();
                    frame.parentNode.removeChild(frame);
                }
            }
        }, self.streamDeletionIntervalMs);

    }

    function updateTotalStreams() {
        let nStreamsLabel = document.getElementById("nStreamsLabel");
        nStreamsLabel.innerHTML = self.totalStreams;
    }


    function setupPlayPause() {
        let playPauseBtn = document.getElementById("playPause");
        playPauseBtn.addEventListener("click", () => {
            if(self.play) {
                self.play = false;
                playPauseBtn.innerHTML = "Play"
            } else {
                self.play = true;
                playPauseBtn.innerHTML = "Pause"
            }
        });
    }

    function setupNumPeersSlider() {
        // Tie number of peers to the slider
        let nPeersSlider = document.getElementById("nPeersSlider");
        nPeersSlider.value = self.maxPeers;

        let nPeersLabel = document.getElementById("nPeerLabel");
        nPeersLabel.innerHTML = self.maxPeers;

        // When the slide changes update the nPeers variable
        nPeersSlider.addEventListener("change", function(){
            self.maxPeers = nPeersSlider.value;
            nPeersLabel.innerHTML = nPeersSlider.value;
        });
    } 

    function createPixelStreamingFrame() {
        // Create an iframe that holds the Pixel Streaming page
        let streamIFrame = document.createElement("iframe");
        streamIFrame.src = "player.html";
        streamIFrame.onload = function(){ 
    
            let pixelStreamingJS = streamIFrame.contentWindow;
    
            // Don't show the play button
            pixelStreamingJS.connect_on_load = true;
            pixelStreamingJS.shouldShowPlayOverlay = false;
    
            // Create a hook for when webRTCPlayer is setup
            let existingSetupPlayerFunc = pixelStreamingJS.setupWebRtcPlayer;
            let newSetupPlayerFunc = function(htmlElement, config){
                config.startVideoMuted = true;
                config.autoPlayAudio = false;
                let webrtcPlayer = existingSetupPlayerFunc(htmlElement, config);
                return webrtcPlayer;
            }
            pixelStreamingJS.setupWebRtcPlayer = newSetupPlayerFunc;
            
    
            pixelStreamingJS.connect(); 
        }
        return streamIFrame;
    }

    // Start here
    startStressTest();

}
