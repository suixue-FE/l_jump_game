import * as THREE from "three";

export class Game {
	config;
	score: number
	scene: THREE.Scene
	camera: THREE.OrthographicCamera // orthographic camera
	cameraPros: {
		current: THREE.Vector3, // current position
		next: THREE.Vector3, // next position
	}
	renderer: THREE.WebGLRenderer // renderer
	size: {
		width: number,
		height: number,
	}
	cubes: any[]
	nextDir: "left" | "right"
	jumperStat: { // mouse object 
		ready: boolean; xSpeed: number; ySpeed: number;
	};
	falledStat: {
		location: number;
		distance: number;
	};
	fallingStat: {
		end: boolean; // is reached the landing point
		speed: number;
	};
	jumper: any;
	successCallback?: (score?: number) => void;
	failedCallback?: (score?: number) => void;

	constructor() {
		// 基础信息 属性
		this.config = {
			background: 0x282828,
			ground: -1, //地面负一	 
			cubeColor: 0xbebebe,
			cubeWidth: 4, //宽	 
			cubeHeight: 2, //高	  
			cubeDeep: 4, //深度	  
			jumperColor: 0x232323, //跳块颜色
			jumperWidth: 1, //宽	  
			jumperHeight: 2, //高
			jumperDeep: 1, //深度	  
		};
		this.score = 0;
		this.scene = new THREE.Scene();
		this.camera = new THREE.OrthographicCamera(window.innerWidth / -50, window.innerWidth / 50, window
			.innerHeight / 50, window.innerHeight / -50, 0, 5000);
		this.cameraPros = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3(0, 0, 0),
		};
		this.renderer = new THREE.WebGLRenderer({
			antialias: true
		});
		this.size = {
			width: window.innerWidth,
			height: window.innerHeight
		};
		this.cubes = [];
		this.nextDir = "left"

		this.jumperStat = {
			ready: false,
			xSpeed: 0,
			ySpeed: 0
		};
		this.falledStat = {
			location: -1,
			distance: 0,
		};
		this.fallingStat = {
			end: false,
			speed: 0.2
		}
	}

	init(canvas: HTMLElement | null) {
		this._setCamera(); // set camera position
		this._setRenderer();
		this._setLight(); // set light 
		this._createCube(); // set undertaking block
		this._createJumper(); // set Jumper
		this._updateCamera(); // 
		this._handleWindowResize();
		window.addEventListener("resize", () => {
			this._handleWindowResize(); //绑定窗口大小
		});
		console.log(canvas, 111111);

		canvas?.addEventListener("mousedown", (event) => {
			console.log(event.currentTarget, 1, event.target);

			if (event.currentTarget !== event.target) {
				return
			}
			//鼠标按下状态
			event.preventDefault();
			event.stopPropagation()
			this._handleMouseDown();
		});
		canvas?.addEventListener("mouseup", (event) => {
			//鼠标松开状态
			event.preventDefault();
			event.stopPropagation()
			this._handleMouseUp()
		});
	};

	_addSuccessFn(fn: (score?: number) => void) {
		this.successCallback = fn
	};

	_addFailedFn(fn: (score?: number) => void) {
		this.failedCallback = fn;
	}
	//绑定窗口大小改变
	_handleWindowResize() {
		this._setSize(); //从新计算
		//从新计算相机位置
		this.camera.left = this.size.width / -80;
		this.camera.right = this.size.width / 80;
		this.camera.top = this.size.height / 80;
		this.camera.bottom = this.size.height / -80;
		this.camera.updateProjectionMatrix(); //从新更新相机位置发生的改变
		this.renderer.setSize(this.size.width, this.size.height);
		this._render();
	};
	//鼠标按下状态
	_handleMouseDown() {
		if (!this.jumperStat.ready && this.jumper.scale.y > 0.02) {
			this.jumper.scale.y -= 0.01;//压缩块
			this.jumperStat.xSpeed += 0.004;
			this.jumperStat.ySpeed += 0.008;
			this._render();
			requestAnimationFrame(() => {
				this._handleMouseDown()
			})
		}
	};
	//鼠标松开谈起状态
	_handleMouseUp() {
		this.jumperStat.ready = true;
		if (this.jumper.position.y >= 1) {
			if (this.jumper.scale.y < 1) {
				this.jumper.scale.y += 0.1;//压缩状态小于1就+
			}
			if (this.nextDir == "left") {
				//挑起盒子落在哪里
				this.jumper.position.x -= this.jumperStat.xSpeed;
			} else {
				this.jumper.position.z -= this.jumperStat.xSpeed;
			}
			this.jumper.position.y += this.jumperStat.ySpeed;
			this.jumperStat.ySpeed -= 0.01;//上升落下状态
			this._render();
			requestAnimationFrame(() => {
				//循环执行
				this._handleMouseUp();
			})
		} else {
			//落下状态
			this.jumperStat.ready = false;
			this.jumperStat.xSpeed = 0;
			this.jumperStat.ySpeed = 0;
			this.jumper.position.y = 1;
			this.jumper.scale.y = 1;
			this._checkInCube();//检测落在哪里
			if (this.falledStat.location == 1) {
				//下落后等于1，+分数
				this.score++;
				this._createCube();
				this._updateCamera();
				this.successCallback?.(this.score);

			} else {
				this._falling()
			}
		}
	};
	//检测落在哪里
	//-1   -10从当前盒子掉落
	//1 下一个盒子上 10从下一个盒子上掉落
	//0没有落在盒子上
	_checkInCube() {
		let distanceCur, distanceNext;
		//当前盒子距离    下一个盒子距离
		let should = (this.config.jumperWidth + this.config.cubeWidth) / 2;
		//
		if (this.nextDir == "left") {
			//往左走了
			distanceCur = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 2].position.x);
			distanceNext = Math.abs(this.jumper.position.x - this.cubes[this.cubes.length - 1].position.x);
		} else {
			//往右走了
			distanceCur = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 2].position.z);
			distanceNext = Math.abs(this.jumper.position.z - this.cubes[this.cubes.length - 1].position.z);
		}
		if (distanceCur < should) {
			//落在当前块
			this.falledStat.distance = distanceCur;
			this.falledStat.location = distanceCur < this.config.cubeWidth / 2 ? -1 : -10;
		} else if (distanceNext < should) {
			//落在下一个块上
			this.falledStat.distance = distanceNext;
			this.falledStat.location = distanceNext < this.config.cubeWidth / 2 ? 1 : 10;
		} else {
			//落在中间
			this.falledStat.location = 0;
		}
	};
	//下落过程
	_falling() {
		if (this.falledStat.location == 10) {
			//从下一个盒子落下
			if (this.nextDir == "left") {
				//判断左方向
				if (this.jumper.position.x > this.cubes[this.cubes.length - 1].position.x) {
					this._fallingRotate("leftBottom")
				} else {
					this._fallingRotate("leftTop")
				}
			} else {
				//判断右方向
				if (this.jumper.position.z > this.cubes[this.cubes.length - 1].position.z) {
					this._fallingRotate("rightBottom")
				} else {
					this._fallingRotate("rightTop")
				}
			}
		} else if (this.falledStat.location == -10) {
			//从当前盒子落下
			if (this.nextDir == "left") {
				this._fallingRotate("leftTop")
			} else {
				this._fallingRotate("rightTop")
			}
		} else if (this.falledStat.location == 0) {
			this._fallingRotate("none")
		}
	};
	//落下旋转
	_fallingRotate(dir: string) {
		let offset = this.falledStat.distance - this.config.cubeWidth / 2;//中间
		let rotateAxis = dir.includes("left") ? 'z' : "x";//以什么轴转
		let rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
		let rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
		let fallingTo = this.config.ground + this.config.jumperWidth / 2 + offset;
		if (dir === 'rightTop') {
			rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
			rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
		} else if (dir === 'rightBottom') {
			rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
			rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
		} else if (dir === 'leftBottom') {
			rotateAdd = this.jumper.rotation[rotateAxis] - 0.1;
			rotateTo = this.jumper.rotation[rotateAxis] > -Math.PI / 2;
		} else if (dir === 'leftTop') {
			rotateAdd = this.jumper.rotation[rotateAxis] + 0.1;
			rotateTo = this.jumper.rotation[rotateAxis] < Math.PI / 2;
		} else if (dir === 'none') {
			rotateTo = false;
			fallingTo = this.config.ground;
		} else {
			throw Error('Arguments Error')
		}
		if (!this.fallingStat.end) {
			if (rotateTo) {
				this.jumper.rotation[rotateAxis] = rotateAdd
			} else if (this.jumper.position.y > fallingTo) {
				this.jumper.position.y -= 0.2;
			} else {
				this.fallingStat.end = true;
			}
			this._render();
			requestAnimationFrame(() => {
				this._falling()
			})
		} else {
			this.failedCallback?.(this.score)
		}
	};
	//设置相机位置
	_setCamera() {
		this.camera.position.set(100, 100, 100);
		this.camera.lookAt(this.cameraPros.current); //镜头对准位置
	};
	//设置render
	_setRenderer() {
		this.renderer.setSize(this.size.width, this.size.height); //画布宽高
		this.renderer.setClearColor(this.config.background);
		document.body.appendChild(this.renderer.domElement); //渲染的画布放到body里面
	};
	//设置灯光
	_setLight() {
		let directionalLight = new THREE.DirectionalLight(0xffffff, 1.1); //平行光  （颜色，强度)
		directionalLight.position.set(2, 10, 5); //平行光位置
		this.scene.add(directionalLight); //在场景中加入平行光
		let light = new THREE.AmbientLight(0xffffff, 0.3); //光的材质
		this.scene.add(light) //把光添加到场景
	};
	//创建块
	_createCube() {
		let geometry = new THREE.BoxGeometry(this.config.cubeWidth, this.config.cubeHeight, this.config.cubeDeep);
		//创建一个几何体对象 （宽，高，深度）
		let material = new THREE.MeshLambertMaterial({
			color: this.config.cubeColor
		});
		//材质,对象包含了颜色、透明度等属性，
		let cube = new THREE.Mesh(geometry, material); //合并在一起
		if (this.cubes.length) {
			//从第二块开始随机左右方向出现
			cube.position.x = this.cubes[this.cubes.length - 1].position.x;
			cube.position.y = this.cubes[this.cubes.length - 1].position.y;
			cube.position.z = this.cubes[this.cubes.length - 1].position.z;
			this.nextDir = Math.random() > 0.5 ? "left" : "right"; //要不左边要不右边
			if (this.nextDir == "left") {
				//左边改变x轴否则y轴
				cube.position.x = cube.position.x - Math.round(Math.random() * 4 + 6);
			} else {
				cube.position.z = cube.position.z - Math.round(Math.random() * 4 + 6);
			}
		}
		this.cubes.push(cube); //统一添加块
		if (this.cubes.length > 5) {
			//页面最多看到5个块
			this.scene.remove(this.cubes.shift()); //超过就移除
		}
		this.scene.add(cube); //添加到场景中
		if (this.cubes.length > 1) {
			//更新镜头位置
			this._updateCameraPros();
		}
	};
	//跳块
	_createJumper() {
		let geometry = new THREE.BoxGeometry(this.config.jumperWidth, this.config.jumperHeight, this.config
			.jumperDeep);// （宽，高，深度）			
		let material = new THREE.MeshLambertMaterial({
			color: this.config.jumperColor
		});//材质,颜色、透明度
		this.jumper = new THREE.Mesh(geometry, material);//合并在一起
		this.jumper.position.y = 1;//显示跳块
		geometry.translate(0, 1, 0);//平移
		this.scene.add(this.jumper);//添加到场景中
	}
	//改变相机的镜头
	_updateCamera() {
		let cur = {
			//当前位置
			x: this.cameraPros.current.x,
			y: this.cameraPros.current.y,
			z: this.cameraPros.current.z,
		};
		let next = {
			//下一个位置
			x: this.cameraPros.next.x,
			y: this.cameraPros.next.y,
			z: this.cameraPros.next.z,
		};
		if (cur.x > next.x || cur.z > next.z) {
			//满足改变
			this.cameraPros.current.x -= 0.1;
			this.cameraPros.current.z -= 0.1;
			if (this.cameraPros.current.x - this.cameraPros.next.x < 0.05) {
				this.cameraPros.current.x = this.cameraPros.next.x;
			} else if (this.cameraPros.current.z - this.cameraPros.next.z < 0.05) {
				this.cameraPros.current.z = this.cameraPros.next.z;
			}
		};
		this.camera.lookAt(new THREE.Vector3(cur.x, 0, cur.z));//镜头的点
		this._render();
		requestAnimationFrame(() => {
			//不断执行
			this._updateCamera();
		})
	};
	//更新镜头位置
	_updateCameraPros() {
		let lastIndex = this.cubes.length - 1;
		let pointA = {
			//当前块
			x: this.cubes[lastIndex].position.x,
			z: this.cubes[lastIndex].position.z,
		};
		let pointB = {
			//下一个块
			x: this.cubes[lastIndex - 1].position.x,
			z: this.cubes[lastIndex - 1].position.z,
		};
		this.cameraPros.next = new THREE.Vector3((pointA.x + pointB.x) / 2, 0, (pointA.z + pointB.z) / 2);
		//当前块跟下一个块除以2得出中间位置
	};
	//设置size
	_setSize() {
		this.size.width = window.innerWidth;
		this.size.height = window.innerHeight;
	};
	//渲染render
	_render() {
		this.renderer.render(this.scene, this.camera);
		//把当前场景相机放进来
	};

	_restart() {
		this.cameraPros = {
			current: new THREE.Vector3(0, 0, 0),
			next: new THREE.Vector3()
		};
		this.fallingStat = {
			end: false,
			speed: 0.2
		};
		let length = this.cubes.length;
		this.scene.remove(this.jumper);
		for (let i = 0; i < length; i++) {
			this.scene.remove(this.cubes.shift());
		}
		this.score = 0;
		this.successCallback?.(this.score);
		this._createCube();
		this._createCube();
		this._createJumper();
		this._updateCamera();
	};
}
