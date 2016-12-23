Math3D = function(){
	function _createRandomCoord(maxR,minR){
		var r=Math.round(Math.random()*(maxR-minR))+minR;
		var theta=Math.random()*Math.PI*2;
		//console.log(theta+"="+theta/Math.PI*180);
		var phi=Math.random()*Math.PI*2;
		//console.log(phi+"="+phi/Math.PI*180);
		
		return get3DAxis(theta,phi,r);
	}
	function get3DAxis(theta,phi,r){
		//X=rsinθcosφ y=rsinθsinφ z=rcosθ
		return{
			x:r*Math.sin(theta)*Math.cos(phi),
			y:r*Math.sin(theta)*Math.sin(phi),
			z:r*Math.cos(theta)
		}
	}
	function get3DAngle(x,y,z){
		//r=sqrt(x*2 + y*2 + z*2); θ= arccos(z/r); φ=arctan(y/x);
		var r=Math.sqrt(x*x + y*y + z*z);
		return{
			theta:Math.acos(z/r),
			phi:Math.atan(y/x),
			r:r
		}
	}
	function getAngle(point){
				return Math.atan2(point.y,point.x)//atan2自带坐标系识别, 注意X,Y的顺序
			}
	function Rotate(source,angle,rudius)//Angle为正时逆时针转动, 单位为弧度
	{
	    var A,R;
	    A = getAngle(source);
	    A += angle;//旋转
	    R = Math.sqrt(source.x * source.x + source.y * source.y)//半径
	    if(rudius){
	    	R-=rudius
	    }
	    return {
	        x : Math.cos(A) * R,
	        y : Math.sin(A) * R
	    }
	}
	function getpositionFromAngel(A,R)//Angle为正时逆时针转动, 单位为弧度
	{
	    
	    return {
	        x : Math.cos(A) * R,
	        y : Math.sin(A) * R
	    }
	}
	
	return{
		createRandomCoord:_createRandomCoord,
		getAngleByAxis2d:getAngle,
		getRotateAxis2d:Rotate,
		getAxis2dByAngle:getpositionFromAngel,
		get3DAxis:get3DAxis,
		get3DAngle:get3DAngle
	}
}();
