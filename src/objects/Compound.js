/**
 * Compound shape
 * @author schteppe - https://github.com/schteppe
 */
CANNON.Compound = function(){
  CANNON.Shape.call(this);
  this.type = CANNON.Shape.types.COMPOUND;
  this.childShapes = [];
  this.childOffsets = [];
  this.childOrientations = [];
};

CANNON.Compound.prototype = new CANNON.Shape();
CANNON.Compound.prototype.constructor = CANNON.Compound;

/**
 * Add a subshape
 * @param Shape shape
 * @param Vec3 offset
 * @param Quaternion orientation
 */
CANNON.Compound.prototype.addChild = function(shape,offset,orientation){
  offset = offset || new CANNON.Vec3(0,0,0);
  orientation = orientation || new CANNON.Quaternion(1,0,0,0);
  this.childShapes.push(shape);
  this.childOffsets.push(offset);
  this.childOrientations.push(orientation);
};

CANNON.Compound.prototype.volume = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++)
    r += this.childShapes[i].volume();
  return r;
};

/**
 * Calculate the inertia in the local frame.
 * @return Vec3
 */
CANNON.Compound.prototype.calculateLocalInertia = function(mass,target){
  target = target || new CANNON.Vec3();

  // Calculate the total volume, we will spread out this objects' mass on the sub shapes
  var V = this.volume();

  for(var i = 0; i<this.childShapes.length; i++){
    // Get child information
    var b = this.childShapes[i];
    var o = this.childOffsets[i];
    var q = this.childOrientations[i];
    var m = b.volume() / V * mass;

    // Get the child inertia, transformed relative to local frame
    var inertia = b.calculateTransformedInertia(m,q);

    // Add its inertia using the parallel axis theorem, i.e.
    // I += I_child;    
    // I += m_child * r^2

    target.vadd(inertia,target);
    var mr2 = new CANNON.Vec3(m*o.x*o.x,
			      m*o.y*o.y,
			      m*o.z*o.z);
    target.vadd(mr2,target);
  }
  return target;
};

CANNON.Compound.prototype.boundingSphereRadius = function(){
  var r = 0.0;
  for(var i = 0; i<this.childShapes.length; i++){
    var candidate = this.childOffsets[i].norm() + this.childShapes[i].boundingSphereRadius();
    if(r < candidate)
      r = candidate;
  }
  return r;
};