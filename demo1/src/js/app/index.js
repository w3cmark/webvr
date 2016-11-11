/*
 * Debug parameters.
 */
WebVRConfig = {
  /**
   * webvr-polyfill configuration
   */

  // Forces availability of VR mode.
  //FORCE_ENABLE_VR: true, // Default: false.

  // Complementary filter coefficient. 0 for accelerometer, 1 for gyro.
  //互补滤波系数。加速度计在静止的时候是很准的，但运动时的角度噪声很大，陀螺仪反之。
  //互补滤波器徘徊在信任陀螺仪和加速度计的边界。首先选择一个时间常数，然后用它来计算滤波器系数。
  //例如陀螺仪的漂移是每秒2度，则可能需要一个少于一秒的时间常数去保证在每一个方向上的漂移不会超过2度。
  //但是当时间常数越低，越多加速度计的噪声将允许通过。所以这是一个权衡的内容。
  //K_FILTER: 0.98, // Default: 0.98.

  // How far into the future to predict during fast motion.
  //由于有给定的方向以及陀螺仪信息，选择允许预测多长时间之内的设备方向，在设备快速移动的情况下可以让渲染比较流畅。
  //PREDICTION_TIME_S: 0.040, // Default: 0.040 (in seconds).

  // Flag to disable touch panner. In case you have your own touch controls
  //TOUCH_PANNER_DISABLED: true, // Default: false.

  // Enable yaw panning only, disabling roll and pitch. This can be useful for
  // panoramas with nothing interesting above or below.
  // 仅关心左右角度变化，忽略上下和倾斜等。
  // YAW_ONLY: true, // Default: false.

  // Enable the deprecated version of the API (navigator.getVRDevices).
  //ENABLE_DEPRECATED_API: true, // Default: false.

  // Scales the recommended buffer size reported by WebVR, which can improve
  // performance. Making this very small can lower the effective resolution of
  // your scene.
  //在VR显示模式下对WebVR推荐的屏幕比例进行缩放。在IOS下如果不为0.5会出现显示问题，查看
  //https://github.com/borismus/webvr-polyfill/pull/106
  BUFFER_SCALE: 0.5, // default: 1.0

  // Allow VRDisplay.submitFrame to change gl bindings, which is more
  // efficient if the application code will re-bind it's resources on the
  // next frame anyway.
  // Dirty bindings include: gl.FRAMEBUFFER_BINDING, gl.CURRENT_PROGRAM,
  // gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING,
  // and gl.TEXTURE_BINDING_2D for texture unit 0
  // Warning: enabling this might lead to rendering issues.
  //允许 VRDisplay.submitFrame使用脏矩形渲染。但是开启此特性可能会出现渲染问题。
  //DIRTY_SUBMIT_FRAME_BINDINGS: true // default: false
};

// Setup three.js WebGL renderer. Note: Antialiasing is a big performance hit.
// Only enable it if you actually need to.
var renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);

// Append the canvas element created by the renderer to document body element.
document.body.appendChild(renderer.domElement);

// Create a three.js scene.
var scene = new THREE.Scene();

// Create a three.js camera.
var camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 10000);

// Apply VR headset positional data to camera.
var controls = new THREE.VRControls(camera);
//站立姿态
controls.standing = true;

// Apply VR stereo rendering to renderer.
var effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// Create a VR manager helper to enter and exit VR mode.
//按钮和全屏模式管理
var params = {
  hideButton: false, // Default: false.
  isUndistorted: false // Default: false.
};
var manager = new WebVRManager(renderer, effect, params);


// Add a repeating grid as a skybox.
var boxSize = 5;
var loader = new THREE.TextureLoader();
loader.load('img/box.png', onTextureLoaded);

function onTextureLoaded(texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(boxSize, boxSize);

  var geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
  var material = new THREE.MeshBasicMaterial({
    map: texture,
    color: 0x01BE00,
    side: THREE.BackSide
  });

  // Align the skybox to the floor (which is at y=0).
  skybox = new THREE.Mesh(geometry, material);
  skybox.position.y = boxSize/2;
  scene.add(skybox);

  // For high end VR devices like Vive and Oculus, take into account the stage
  // parameters provided.
  //在高端的设备上，要考虑到设备提供的场景信息的更新。
  setupStage();
}

// Create 3D objects.
var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
for ( var i = 0; i < geometry.faces.length; i += 2 ) {

    var hex = Math.random() * 0xffffff;
    geometry.faces[ i ].color.setHex( hex );
    geometry.faces[ i + 1 ].color.setHex( hex );

}
var material = new THREE.MeshBasicMaterial({ vertexColors: THREE.FaceColors});
var cube = new THREE.Mesh(geometry, material);
cube.position = new THREE.Vector3(0,0,0);

// Position cube mesh to be right in front of you.
cube.position.set(0, controls.userHeight, -1);

// Add cube mesh to your three.js scene
scene.add(cube);

// Kick off animation loop
requestAnimationFrame(animate);

window.addEventListener('resize', onResize, true);
window.addEventListener('vrdisplaypresentchange', onResize, true);

// Request animation frame loop function
var lastRender = 0;
function animate(timestamp) {
  var delta = Math.min(timestamp - lastRender, 500);
  lastRender = timestamp;

  //立方体的旋转
  cube.rotation.y += delta * 0.0006;
  cube.rotation.x += delta * 0.0005;

  // Update VR headset position and apply to camera.
  //更新获取HMD的信息
  controls.update();

  // Render the scene through the manager.
  //进行camera更新和场景绘制
  manager.render(scene, camera, timestamp);

  requestAnimationFrame(animate);
}

function onResize(e) {
  effect.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

var display;

// Get the HMD, and if we're dealing with something that specifies
// stageParameters, rearrange the scene.
function setupStage() {
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      display = displays[0];
      if (display.stageParameters) {
        setStageDimensions(display.stageParameters);
      }
    }
  });
}

function setStageDimensions(stage) {
  // Make the skybox fit the stage.
  var material = skybox.material;
  scene.remove(skybox);

  // Size the skybox according to the size of the actual stage.
  var geometry = new THREE.BoxGeometry(stage.sizeX, boxSize, stage.sizeZ);
  skybox = new THREE.Mesh(geometry, material);

  // Place it on the floor.
  skybox.position.y = boxSize/2;
  scene.add(skybox);

  // Place the cube in the middle of the scene, at user height.
  // cube.position.set(0, controls.userHeight, 0);
}
