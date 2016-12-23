function WBGL(options){
    this.options = options || {};
    this.canvas = document.getElementById(this.options.canvas);
    // this.canvas.width = window.innerWidth;
    // this.canvas.height = window.innerHeight;
    // this.canvas.style.background = '#000';
    if(!this.canvas){
        return;
    }
    this.global = {
        w: this.canvas.clientWidth,
        h: this.canvas.clientHeight,
        renderer: new THREE.WebGLRenderer({
                    antialias : true
                }),
        scene: new THREE.Scene(),
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(),
        camera: '',
        planes: [
            // ["ship1","http://test.nie.163.com/three_tech/resource/part1/ship1.png",1024,1024,700,-400,0,1],//name,pic,w,h,x,y,z,透明度
            // ["plan1","http://test.nie.163.com/three_tech/resource/part1/plan_1.png",1024,256,-170,50,-2000,1],
            // ["air","http://test.nie.163.com/three_tech/resource/part1/airplane_1.png",512,512,150,100,-3000,1],
            // ["star1","http://test.nie.163.com/three_tech/resource/part1/star_1.png",2317,979,150,0,-4500,1],
            // ["dot1","img/dot.png",40,40,750,-20,1000,1],
            ["play","img/btn_video_play.png", 80, 80, -2000, 316, 0, 1],
            ["light","img/light.png",1152, 1024, 200, 50, -7500, 1]
            // ["part1_bg","img/part1_bg.jpg",2048*1.5,1024*1.5,0,0,-18000,1]
        ],
        haven: '',
        effect: '',
        controls: '',
        isVR: this.options.isVR,
        manager: '',
        isFocus: false,
        focusSet: '',
        sky: '',
        videoEle: this.options.videoEle,
        videoMesh: '',
        dot: []
    };
    // _this = this;
    this.init();
}
WBGL.prototype = {
    init: function(){
        var self = this;
        self.global.renderer.setPixelRatio( window.devicePixelRatio );
        self.global.renderer.setSize(self.global.w, self.global.h);
        self.canvas.appendChild(self.global.renderer.domElement);
        // self.global.renderer.setClearColor(0xFFFFFF, 1.0);
        // self.global.renderer = new THREE.WebGLRenderer({
        //     canvas: self.canvas,
        //     antialias : true
        // });

        self.initCamera();

        // self.global.controls = new THREE.DeviceOrientationControls( self.global.camera );
        // console.log(self.global.camera)
        
        
        // self.global.controls.target.set(
        //   parseInt(self.global.camera.position.x),
        //   parseInt(self.global.camera.position.y),
        //   parseInt(self.global.camera.position.z)
        // );
        // self.global.controls.noPan = true;
        // self.global.controls.noZoom = true;
        // self.global.camera.lookAt(new THREE.Vector3(0,0,0));

        function setOrientationControls(e){
            console.log(e)
            if (e.alpha) {
                self.global.controls = new THREE.DeviceOrientationControls(self.global.camera, true);
                self.global.controls.connect();
                self.global.controls.update();
            }
            window.removeEventListener('deviceorientation', setOrientationControls, true);
        }
        window.addEventListener('deviceorientation', setOrientationControls, true);

        if(self.global.isVR){
            self.global.effect = new THREE.StereoEffect( self.global.renderer );
        }else{
            self.global.controls = new THREE.OrbitControls(self.global.camera, self.global.renderer.domElement);
        }
        
        self.loadMtlObj();

        self.addPlanes();

        self.global.sky = self.addSkyBox(self.global.scene);
        
        // console.log(self.global.dot)
        
        self.initLight();

        window.addEventListener( 'resize', function(){
            self.onresize();
        }, false );
        self.createVideo();
        // self.createVideo(0,600);
    },
    initCamera: function(){
        var self = this;
        self.global.camera = new THREE.PerspectiveCamera(45, self.global.w / self.global.h, 1, 500000);
        self.global.camera.position.set(0,250,1200);
        self.global.camera.lookAt(new THREE.Vector3(0,0,0));
    },
    clickPointLoop:function (point,scale,time,delay){
        var self = this;
        // console.log(self.global.isFocus)
        if(self.global.isFocus){return}
        time=time&&time!=0?time:1000;
        delay=delay?delay:0;

        if(point.scale.x<scale[1]){
            new TWEEN.Tween(point.scale).to({x:scale[1],y:scale[1],z:scale[1]},time).delay(delay)
                .onComplete(function(){
                    self.clickPointLoop(point,scale);
                })
                .start();

        }else{
            new TWEEN.Tween(point.scale).to({x:scale[0],y:scale[0],z:scale[0]},time).delay(delay)
                .onComplete(function(){
                    self.clickPointLoop(point,scale);
                })
                .start();
        }
        
    },
    onresize: function(){
        var self = this;
        // console.log(self.global.renderer)
        self.global.camera.aspect = window.innerWidth / window.innerHeight;
        self.global.camera.updateProjectionMatrix();

        self.global.renderer.setSize( window.innerWidth, window.innerHeight );
    },
    
    creatObj : function(options){
        var self = this;
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin(this.crossOrigin);
        var texture = loader.load(options.pic, function(){}, undefined, function(){});
        var MaterParam = {
            map: texture,
            overdraw: true,
            side: THREE.FrontSide,
            transparent: options.transparent,
            //needsUpdate:true,
            //premultipliedAlpha: true,
            opacity:options.opacity
        }
        if(options.blending){
            MaterParam.blending=THREE.AdditiveBlending
        }
        var plane = new THREE.Mesh(
            new THREE.PlaneGeometry( options.width, options.height, 1, 1 ),
            new THREE.MeshBasicMaterial(MaterParam  )
        );
        return plane;
    },
    addPlanes: function(){
        var self = this;

        self.global.planes.forEach(function(planeSet){
            var scale = (1500-planeSet[6])*2*Math.tan(22.5*Math.PI/180)/1080;
            
            var plane = self.creatObj({
                width:parseInt(planeSet[2]*scale),
                height:parseInt(planeSet[3]*scale),
                pic:planeSet[1],
                transparent:true,
                opacity:1//planeSet[7]
            })
            plane.position.set(parseInt(planeSet[4]*scale),parseInt(planeSet[5]*scale),planeSet[6]);
            
            plane.name = planeSet[0];
            //plane.visible=false;
            if(planeSet[0] == 'play'){
                self.global.dot.push(plane);
                plane.visible = false;
                plane.rotation.y= 1.6;
            }
            
            self.global.scene.add(plane);
        })
    },
    initLight: function(){
        var self = this;
        var light = new THREE.AmbientLight(0xffffff);
        // self.global.light.position.set(100, 100, 200);
        self.global.scene.add(light);

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( -5, 5, 5).normalize();
        self.global.scene.add( directionalLight );
    },
    createMtlObj: function(options){
        //      options={
        //          mtlBaseUrl:"",
        //          mtlPath:"",
        //          mtlFileName:"",
        //          objPath:"",
        //          objFileName:"",
        //          completeCallback:function(object){  
        //          }
        //          progress:function(persent){
        //              
        //          }
        //      }
        THREE.Loader.Handlers.add( /\.dds$/i, new THREE.DDSLoader() );
        var mtlLoader = new THREE.MTLLoader();
        mtlLoader.setBaseUrl( options.mtlBaseUrl );//设置材质路径
        mtlLoader.setPath( options.mtlPath );//设置mtl文件路径
        mtlLoader.load( options.mtlFileName, function( materials ) {
            materials.preload();
            var objLoader = new THREE.OBJLoader();
            objLoader.setMaterials( materials );//设置三维对象材质库
            objLoader.setPath( options.objPath );//设置obj文件所在目录
            objLoader.load( options.objFileName, function ( object ) {
                 
                if(typeof options.completeCallback=="function"){
                    options.completeCallback(object);
                }
            }, function ( xhr ) {
                if ( xhr.lengthComputable ) {
                    var percentComplete = xhr.loaded / xhr.total * 100;
                    if(typeof options.progress =="function"){
                        options.progress( Math.round(percentComplete, 2));
                    }
                    //console.log( Math.round(percentComplete, 2) + '% downloaded' );
                }
            }, function(error){
                 
            });
     
        });
    },
    loadMtlObj: function(){
        var self = this;
        self.createMtlObj({
            mtlBaseUrl:"haven/",
            mtlPath: "haven/",
            mtlFileName:"threejs.mtl",
            objPath:"haven/",
            objFileName:"threejs.obj",
            completeCallback:function(object){
                $(".loading").text("100%");
                object.traverse(function(child) { 
                    if (child instanceof THREE.Mesh) { 
                        child.material.side = THREE.DoubleSide;//设置贴图模式为双面贴图
                        child.material.emissive.r=0;//设置rgb通道R通道颜色
                        child.material.emissive.g=0.01;//设置rgb通道G通道颜色
                        child.material.emissive.b=0.05;//设置rgb通道B通道颜色
                        child.material.transparent=true;//材质允许透明
                        //child.material.opacity=0;//材质默认透明度                        
                        //child.material.shading=THREE.SmoothShading;//平滑渲染
                    }
                });
                object.emissive=0x00ffff;//自发光颜色
                object.ambient=0x00ffff;//环境光颜色
                object.rotation.x= 0;//x轴方向旋转角度
                object.position.y = 0;//位置坐标y
                object.position.z = 0;//位置坐标z
                object.scale.x=0.01;//缩放级别
                object.scale.y=0.01;//缩放级别
                object.scale.z=0.01;//缩放级别
                object.name="haven";//刚体名称
                object.rotation.y=0;//初始Y轴方向旋转角度
                self.global.haven = object;
                self.global.scene.add(object);//添加到场景中
                self.openAni();
                self.animation();
            },
            progress:function(persent){
                $(".loading").text(persent+"%");
            }
        })
    },
    openAni: function(){
        var self = this;
        // self.global.camera.lookAt( new THREE.Vector3(0,0,-20000) );
        new TWEEN.Tween( self.global.haven.scale )
            .to({x:1,y:1,z:1}, 500 )
            .easing(TWEEN.Easing.Quadratic.InOut)
            .delay(1000)
            .start();
        // self.global.haven.rotation.y += 0.05;
        new TWEEN.Tween( self.global.haven.rotation )
            .to({x:0,y:4.8,z:0}, 500 )
            .easing(TWEEN.Easing.Quadratic.InOut)
            .delay(1000)
            .onComplete(function(){
                var obj1 = self.createSpriteMaterial("dot1", -340,60, 280, 60),
                    obj1_h = self.createSpriteMaterial("dot1_h", -340,60, 281, 0),
                    obj2 = self.createSpriteMaterial("dot2", 340,60, 280, 60),
                    obj2_h = self.createSpriteMaterial("dot2_h", 340,60, 281, 0);
                self.global.dot.push(obj1);
                self.global.dot.push(obj1_h);
                obj1_h.visible = false;
                self.global.dot.push(obj2);
                self.global.dot.push(obj2_h);
                obj2_h.visible = false;
                self.global.scene.add(obj1);
                self.global.scene.add(obj1_h);
                self.global.scene.add(obj2);
                self.global.scene.add(obj2_h);
                self.global.dot[0].visible=true;
                // self.clickPointLoop(self.global.dot[0],[1,1.5]);
                // self.clickPointLoop(self.global.dot[1],[60,70]);
                // self.clickPointLoop(self.global.dot[3],[60,70]);
            })
            .start();
        $('.loading').hide();
        if(self.global.isVR){
            $('.pic1').show();
            $('.pic2').show();
            $('.pic3').hide();
        }else{
            $('.pic1').hide();
            $('.pic2').hide();
            $('.pic3').show();
        }
        
    },
    addSkyBox: function(scene){
        var path = "img/";
        var format = '.jpg';
        var urls = [
                path + 'px' + format, path + 'nx' + format,
                path + 'py' + format, path + 'ny' + format,
                path + 'pz' + format, path + 'nz' + format
            ];
        var materials = []; 
        for (var i = 0; i < urls.length; ++i) {
            var loader = new THREE.TextureLoader();
            loader.setCrossOrigin( this.crossOrigin );
            var texture = loader.load( urls[i], function(){}, undefined, function(){} );
            
            materials.push(new THREE.MeshBasicMaterial({
                //map: THREE.ImageUtils.loadTexture(urls[i], {},function() { }), 
                map: texture, 
                overdraw: true,
                side: THREE.BackSide,
                premultipliedAlpha: true
            })
            ); 
            
        } 
        
        var cube = new THREE.Mesh(new THREE.CubeGeometry(9000, 9000,9000), new THREE.MeshFaceMaterial(materials)); 
        cube.name="sky";
        scene.add(cube);
        // stageSetting.part0.objects.sky=cube;
        return {mesh:cube,meter:materials};
    },
    createSprite: function(width,height,colors){
        var canvas = document.createElement( 'canvas' );
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext( '2d' );
        var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
        colors.forEach(function(color){
            gradient.addColorStop( color.start, color.rgba );
        })
        context.fillStyle = gradient;
        context.fillRect( 0, 0, canvas.width, canvas.height );
        return canvas;
        
    },
    createMaterial: function(width,height,colors){
        var self = this;
        var sprite=self.createSprite(width,height,colors);
        return new THREE.SpriteMaterial( {
            map: new THREE.CanvasTexture( sprite ),
            blending: THREE.AdditiveBlending,
            overdraw:false,
            depthWrite:false
        } )
     },
    createSpriteMaterial: function(name, x, y, z, scale){//添加交互点
        // var textureLoader = new THREE.TextureLoader(),
        //     map = textureLoader.load(img),
        //     mat = new THREE.SpriteMaterial( { map: map, color: color, fog: true } ),
        //     obj = new THREE.Sprite(mat);
        var self = this;
        var sprite=self.createMaterial(128,128,[{start:0,rgba:'rgba(255,192,41,1)'},
                                                    {start:0.2,rgba:'rgba(255,192,41,1)'},
                                                    {start:0.21,rgba:'rgba(0,0,0,0)'},
                                                    {start:0.4,rgba:'rgba(0,0,0,0)'},
                                                    {start:0.65,rgba:'rgba(255,192,41,0.8)'},
                                                    {start:0.85,rgba:'rgba(0,0,0,0)'},
                                                    {start:0.9,rgba:'rgba(0,0,0,0)'},
                                                    {start:0.99,rgba:'rgba(255,192,41,0.2)'},
                                                    {start:1,rgba:'rgba(0,0,0,0)'}])
        obj = new THREE.Sprite(sprite);
        obj.scale.set(scale, scale, scale);
        obj.position.set( x, y, z );
        obj.name = name;
        return obj;
    },
    createVideo: function(w,h){
        var self = this;
        // var geometry = new THREE.SphereBufferGeometry( 500, 500, 40 ).toNonIndexed();
        var geometry = new THREE.PlaneGeometry( 740, 416, 1, 1);
        geometry.scale( 2, 2, 2 );

        // console.log(self.global.videoEle)

        var texture = new THREE.VideoTexture(self.global.videoEle );
        texture.minFilter = THREE.LinearFilter;
        texture.format = THREE.RGBFormat;

        var material   = new THREE.MeshBasicMaterial( { map : texture } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(-740*4, 416, 1);
        mesh.rotation.y= 1.6;
        self.global.scene.add( mesh );
        self.global.videoMesh = mesh;
    },
    inFocus: function(obj){
        var self = this;
        if(self.global.isFocus) {
            return;
        }
        self.global.isFocus = true;
        // var all = TWEEN.getAll();
        if(obj.name == 'dot1'){
            self.global.dot[2].visible=true;
            new TWEEN.Tween( self.global.dot[2].scale )
                .to({x:80,y:80,z:80}, 1500 )
                .start();
        }else if(obj.name == 'dot2'){
            self.global.dot[4].visible=true;
            new TWEEN.Tween( self.global.dot[4].scale )
                .to({x:80,y:80,z:80}, 1500 )
                .start();
        }else if(obj.name == 'play'){
            new TWEEN.Tween( obj.scale )
                .to({x:2,y:2,z:2}, 1500 )
                .start();
        }else{
            return;
        }
        

        self.global.focusSet = setTimeout(function(){
            console.log('in 1.5s');
            if(obj.name == 'dot1'){
                self.changeLookat(1, 5.3);
            }else if(obj.name == 'dot2'){
                self.changeLookat(1, 4);
            }else if(obj.name == 'play'){//播放视频
                    // self.createVideo();
                    obj.visible = false;
                    self.global.videoEle.play();
                    // self.global.camera.position.set(1224,93,-65);
                    // new TWEEN.Tween( self.global.camera.rotation )
                    //     .to({y:-0.1}, 1000 )
                    //     .start();
                    // console.log(self.global.videoMesh.position)
                    // self.global.camera.lookAt( self.global.videoMesh.position);
                    // self.global.controls.target.set(
                    //   parseInt(self.global.videoMesh.position.x),
                    //   parseInt(self.global.videoMesh.position.y),
                    //   parseInt(self.global.videoMesh.position.z)
                    // );
                    // alert(1);
            }
            
        },1500);
    },
    outFocus: function(){
        // console.log('out');
        var self = this;
        if(!self.global.isFocus){return}
        self.global.isFocus = false;
        setTimeout(function(){
            
            clearTimeout(self.global.focusSet);
            TWEEN.removeAll();
            new TWEEN.Tween( self.global.dot[2].scale )
                .to({x:0,y:0,z:0}, 800 )
                .onComplete(function(){
                    self.global.dot[2].visible = false;
                })
                .start();
            new TWEEN.Tween( self.global.dot[4].scale )
                .to({x:0,y:0,z:0}, 800 )
                .onComplete(function(){
                    self.global.dot[4].visible = false;
                })
                .start();
            new TWEEN.Tween( self.global.dot[0].scale )
                .to({x:1,y:1,z:1}, 800 )
                .start();
            self.changeLookat(0);
            self.clickPointLoop(self.global.dot[0],[1,1.5]);
            self.clickPointLoop(self.global.dot[1],[80,90]);
            self.clickPointLoop(self.global.dot[3],[80,90]);
        },1000)
        
    },
    changeLookat: function(n, r_y){
        var self = this;
        if(n === 1){
            new TWEEN.Tween( self.global.haven.scale )
                .to({x:2,y:2,z:2}, 1000 )
                .start();
            new TWEEN.Tween( self.global.haven.rotation )
                .to({x:0,y:r_y,z:0}, 1000 )
                .start();
        }else{
            new TWEEN.Tween( self.global.haven.scale )
                .to({x:1,y:1,z:1}, 800 )
                .start();
            new TWEEN.Tween( self.global.haven.rotation )
                .to({x:0,y:4.8,z:0}, 800 )
                .start();
        }
        
    },
    animation: function(){
        var self = this;
        // var r = Date.now() * 0.0005;
        // self.global.haven.position.x = 700 * Math.cos( r );
        // self.global.haven.position.z = 700 * Math.sin( r );
        // self.global.haven.position.y = 700 * Math.sin( r );
        if(!self.global.isFocus){
            // self.global.haven.rotation.y += 0.001;
            // self.global.sky.mesh.rotation.y += 0.0005;
            var newCameraPos=Math3D.getRotateAxis2d({
                    x:self.global.camera.position.x,
                    y:self.global.camera.position.z
                },-0.001,0);
                self.global.camera.position.x=newCameraPos.x;
                self.global.camera.position.z=newCameraPos.y;
            
                self.global.camera.lookAt(self.global.haven.position);
        }
        
        self.global.controls.update();
        // self.global.camera.rotation.x = self.global.camera.rotation.x + 0.01;
        // console.log(self.global.camera.rotation)
        // self.global.camera.rotation.z -= 1;
        // var cy = self.global.camera.rotation.y.toFixed(2);
        // var cz = self.global.camera.rotation.z.toFixed(2);
        // $('#info').html(cx+'_'+cy+'_'+cz);

        //碰撞检测
        self.global.raycaster.setFromCamera(self.global.mouse, self.global.camera);
        var intersects = self.global.raycaster.intersectObjects(self.global.dot);

        if ( intersects.length > 0 && intersects[0].distance != 0) {
            // console.log(intersects);
            self.inFocus(intersects[0].object);
        }else{
            self.outFocus();
        }

        if(self.global.isVR){
            self.global.effect.render(self.global.scene, self.global.camera);
        }else{
            self.global.renderer.render(self.global.scene, self.global.camera);
        }
        // self.global.camera.lookAt( new THREE.Vector3(0,0,-20000) );
        // self.global.camera.lookAt(new THREE.Vector3(0,0,0));
        TWEEN.update();
        requestAnimationFrame(function(){
            self.animation();
        });
    }
}

var $btn = $('.btn a');
var wbGLd;
var videoEle = document.createElement( 'video' );
// videoEle.width = w;
// videoEle.height = h;
// self.global.videoEle.loop = true;
videoEle.muted = true;
videoEle.src = "data/75551bae417ecd7cd98023708a8f04f2qt.mp4";
videoEle.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );
videoEle.setAttribute( 'playsinline', 'playsinline' );
$btn.on('click', function(){
    var $this = $(this),
        isvr = false;
    // console.log($this.index())

    if($this.index() == 1 && "onorientationchange" in window){
        isvr = true;
    }else if($this.index() == 1){
        alert('您的设备不支持VR模式！');
    }
    $this.parent().hide();
    $('.ewm').hide();
    $('.loading').show();
    videoEle.play();
    setTimeout(function(){
        videoEle.pause();
        videoEle.muted = false;
    },500);
    wbGLd=new WBGL({
        canvas: 'canvas-frame',
        isVR: isvr,
        videoEle: videoEle
    })
})

