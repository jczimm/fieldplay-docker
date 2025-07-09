/**
 * The main entry point to the application.
 *
 * It is initialized immediately with webgl, and puts
 * vue.js app loading into the future.
 */
import initScene from './scene';
import bus from './bus';
import { initAutoMode } from './autoMode';

var canvas = document.getElementById('scene');
// Canvas may not be available in test run
if (canvas) initVectorFieldApp(canvas);

// Tell webpack to split bundle, and download settings UI later.
require.ensure('@/vueApp.js', () => {
  // Settings UI is ready, initialize vue.js application
  require('@/vueApp.js');
});

function initVectorFieldApp(canvas) {
  canvas.width = window.innerWidth;
  canvas.height =  window.innerHeight;
  var ctxOptions = {antialiasing: false };

  var gl = canvas.getContext('webgl', ctxOptions) ||
          canvas.getContext('experimental-webgl', ctxOptions);

  if (gl) {
    window.webGLEnabled = true;
    var scene = initScene(gl);
    scene.start();
    initAutoMode(scene);
    window.scene = scene;
  } else {
    window.webGLEnabled = false;
  }
}

var CCapture;
var currentCapturer;

window.startRecord = startRecord;
window.isRecording = false;

function startRecord(url) {
  if (!CCapture) {
    require.ensure('ccapture.js', () => {
      CCapture = require('ccapture.js');
      window.stopRecord = stopRecord;
      startRecord(url);
    });

    return;
  }

  if (currentCapturer) {
    currentCapturer.stop();
  }

  if (!ffmpegScriptLoaded()) {
    var ffmpegServer = document.createElement('script');
    ffmpegServer.setAttribute('src', url || `http://${location.hostname}:8401/ffmpegserver/ffmpegserver.js`);
    ffmpegServer.onload = () => startRecord(url);
    document.head.appendChild(ffmpegServer);
    return;
  }

  currentCapturer = new CCapture( {
      format: 'ffmpegserver',
      framerate: 60,
      verbose: true,
      name: "fieldplay",
      extension: ".webm",
      ffmpegArguments: [
        "-b:v", "12M",
      ],
  });

  window.isRecording = true;
  currentCapturer.start();
  bus.fire('start-record', currentCapturer)
}

function ffmpegScriptLoaded() {
  return typeof FFMpegServer !== 'undefined'
}

function stopRecord() {
  window.isRecording = false;
  bus.fire('stop-record', currentCapturer)
  console.log('Stopping recording...');
  currentCapturer.stop();
  console.log('Stopped. Converting to video...');
  currentCapturer.save((outputHostedPath) => {
    const downloadUrl = `http://${location.hostname}:8401${outputHostedPath}`;
    console.log('Converted. Download at', downloadUrl);
    // window.open(downloadUrl);
  });
}
