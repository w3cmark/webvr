function WBGL(options){
    this.options = options || {};
    this.canvas = document.getElementById(this.options.canvas);
    if(!this.canvas){
        return;
    }
    this.global = {
        w: this.canvas.clientWidth,
        h: this.canvas.clientHeight,
        renderer: new THREE.WebGLRenderer(),
        scene: new THREE.Scene(),
        camera: '',
        planes: [
            // ["ship1","http://test.nie.163.com/three_tech/resource/part1/ship1.png",1024,1024,700,-400,0,1],//name,pic,w,h,x,y,z,透明度
            // ["plan1","http://test.nie.163.com/three_tech/resource/part1/plan_1.png",1024,256,-170,50,-2000,1],
            // ["air","http://test.nie.163.com/three_tech/resource/part1/airplane_1.png",512,512,150,100,-3000,1],
            // ["star1","http://test.nie.163.com/three_tech/resource/part1/star_1.png",2317,979,150,0,-4500,1],
            // ["star2","http://test.nie.163.com/three_tech/resource/part1/star_2.png",256,128,500,-100,-6000,1],
            ["light","../img/light.png",1152,1024,200,50,-7500,1],
            ["part1_bg","../img/part1_bg.jpg",2048*1.5,1024*1.5,0,0,-18000,1]
        ],
        _haven: ''
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

        self.initCamera();

        self.loadMtlObj();

        self.initLight();
        
        self.addPlanes();

        window.addEventListener( 'resize', onresize, false );
    },
    onresize: function(){
        var self = this;
        // console.log(self.global.renderer)
    },
    initCamera: function(){
        var self = this;
        self.global.camera = new THREE.PerspectiveCamera(45, self.global.w / self.global.h, 1, 500000);
        self.global.camera.position.x = 0;
        self.global.camera.position.y = 0;
        self.global.camera.position.z = 10000;
        self.global.camera.up.x = 0;
        self.global.camera.up.y = 1;
        self.global.camera.up.z = 0;
        self.global.camera.lookAt({
            x : 0,
            y : 0,
            z : 0
        });
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
        //      object.rotation.x= 0;//x轴方向旋转角度
                object.position.y = 0;//位置坐标X
                object.position.z = 0;//位置坐标y
                object.scale.x=1;//缩放级别
                object.scale.y=1;//缩放级别
                object.scale.z=1;//缩放级别
                object.name="haven";//刚体名称
                object.rotation.y=-Math.PI;//初始Y轴方向旋转角度
                self.global._haven = object;
                self.global.scene.add(object);//添加到场景中
                self.animation();
            },
            progress:function(persent){
                 
                // $("#havenloading .progress").css("width",persent+"%");
            }
        })
    },
    animation: function(){
        var self = this;
        // console.log(self.global._haven.rotation)
        // self.global.camera.lookAt( new THREE.Vector3(0,0,-20000) );
        if(self.global.camera.position.z > 1500){
            self.global.camera.position.z -= 100;
            self.global._haven.rotation.y += 0.01;
            self.global._haven.rotation.x += 0.005;
        }else{
            self.global._haven.rotation.y += 0.003;
        }
        
        
        self.global.renderer.render(self.global.scene, self.global.camera);
        requestAnimationFrame(function(){
            self.animation();
        });
    }
}
new WBGL({
    canvas: 'canvas-frame'
})