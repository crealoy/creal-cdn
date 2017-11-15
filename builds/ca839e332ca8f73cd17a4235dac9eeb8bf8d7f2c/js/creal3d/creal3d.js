(function() {
  window.Creal3D = function( el, options ) {
    options = options || {};

    var container = el;
    var camera, controls, scene, renderer;
    var crealobj, controls;

    var windowWidth;
    var mouseRotationY = 0;

    function objOnProgress( xhr ) {
      if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% of object downloaded' );
      }
    }

    function objOnError( xhr ) {
      console.log( 'Downloading object failed' );
    }

    function init() {
      // First create a camera with the container element aspect ratio
      camera = new THREE.PerspectiveCamera( 45, container.offsetWidth / container.offsetHeight, 1, 1000 );
      camera.position.z = options.cameraDistance || 30;

      // Then create a scene with a background color
      scene = new THREE.Scene();
      if ( options.background) {
        scene.background = new THREE.Color( options.background );
      }

      // Create a PointLight coming from behind the camera and add to scene
      var light = new THREE.PointLight( options.lightColor || 0xffffff );
      light.position.set(0, 0, 1000);
      scene.add(light);

      // Create a LoadingManager and load the 3D object
      var manager = new THREE.LoadingManager();
      var loader = new THREE.OBJLoader( manager );
      loader.load( options.src || 'creal3d.obj', function ( obj ) {
        // Create sold MeshPhongMaterial for each mesh in the object
        obj.traverse( function ( child ) {
          if ( child instanceof THREE.Mesh ) {
            child.material = new THREE.MeshPhongMaterial( { color: options.color || 0xffffff } );
          }
        } );

        // Save the object so that we can rotate it and add it to the scene
        crealobj = obj;
        scene.add(obj);

        obj.position.x = options.offsetX || 0;
        obj.position.y = options.offsetY || 0;

        // Create DeviceOrientationControls that rotate the object
        controls = new THREE.DeviceOrientationControls( obj );
      }, objOnProgress, objOnError );

      try {
        // Create renderer for the pixel ratio and size
        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( container.offsetWidth, container.offsetHeight );

        // Remove all other elements from the container and add ours
        while ( el.firstChild ) {
          el.removeChild( el.firstChild );
        }
        el.appendChild( renderer.domElement );

        // Listen to mouse move events to enable rotation
        document.addEventListener( 'mousemove', onDocumentMouseMove, false );

        // Listen to window resize events, needed for mouse tracking and element resize
        window.addEventListener( 'resize', onWindowResize, false );
        windowWidth = window.innerWidth;
      } catch (e) {
        console.log('Error initialising 3D renderer: ' + e);
      }
    }

    function onDocumentMouseMove( event ) {
      if (windowWidth) {
        mouseRotationY = ( event.clientX - windowWidth / 2 ) / windowWidth;
      }
    }

    function onWindowResize() {
      windowWidth = window.innerWidth;

      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();

      renderer.setSize( container.offsetWidth, container.offsetHeight );
    }

    function animate() {
      requestAnimationFrame( animate );
      if ( controls ) {
        controls.update();
        if ( crealobj ) {
          // Lock rotation on X and Z axis
          crealobj.rotation.x = 0;
          crealobj.rotation.z = 0;

          // Add mouse rotation and multiply rotation
          crealobj.rotation.y += mouseRotationY;
          crealobj.rotation.y *= 3;
        }
      }
      render();
    }

    function render() {
      camera.lookAt( scene.position );
      renderer.render( scene, camera );
    }

    init();
    if (renderer != null) {
      animate();
    }
  };
})();
