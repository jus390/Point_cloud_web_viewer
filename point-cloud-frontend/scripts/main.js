if (!Detector.webgl) Detector.addGetWebGLMessage();
var stats;

var timer = null;

var CancelToken = axios.CancelToken;
var source = CancelToken.source();

var scene;
var camera;
var renderer;
var starsGeometry;

var starsMaterial;
var points;
var controls;
var starField;

var MAX_POINTS = 200000;
var currentPoint = 0;
var basePoints = [];
var basePointsCount = 0;

var prevLoc = {};

var autoFetch = true;

var init = function () {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  controls = new THREE.OrbitControls(camera);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  var container = document.getElementById("container");
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  var positions = new Float32Array(MAX_POINTS * 3);
  var colors = new Float32Array(MAX_POINTS * 3);
  var sizes = new Float32Array(MAX_POINTS);

  starsGeometry = new THREE.BufferGeometry();
  starsGeometry.addAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3)
  );
  starsGeometry.addAttribute(
    "customColor",
    new THREE.BufferAttribute(colors, 3)
  );
  starsGeometry.addAttribute("size", new THREE.BufferAttribute(sizes, 1));

  let clr = new THREE.Color(0xffffff);
  for (let i = 0; i < MAX_POINTS; i++) {
    clr.toArray(colors, i * 3);
  }

  var starsMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color: {
        value: new THREE.Color(0xffffff)
      }
    },
    vertexShader: document.getElementById("vertexshader").textContent,
    fragmentShader: document.getElementById("fragmentshader").textContent
  });
  /*starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff
  });*/
  //starsMaterial.size = 0.005;

  starField = new THREE.Points(starsGeometry, starsMaterial);

  scene.add(starField);

  camera.position.z = 10;
  prevLoc = camera.position.clone();
  controls.update();
};

var fetchBasePoints = function () {
  try {
    axios
      .post("http://localhost:1107/points", {
        depth: 2
      })
      .then(res => {
        basePointsCount = res.data.points.length;
        for (let p of res.data.points) {
          if (currentPoint > MAX_POINTS) {
            currentPoint = 0;
            /*source.cancel('Operation canceled by the user.');
                return;*/
          }
          let positions = starField.geometry.attributes.position.array;
          let size = starField.geometry.attributes.size.array;
          size[currentPoint] = 0.01;
          positions[currentPoint * 3] = p.point[0];
          positions[currentPoint * 3 + 1] = p.point[2];
          positions[currentPoint * 3 + 2] = p.point[1];

          currentPoint++;
          basePoints.push(p);
        }
        starField.geometry.attributes.position.needsUpdate = true;
        starField.geometry.attributes.size.needsUpdate = true;
        starField.geometry.setDrawRange(0, MAX_POINTS);
        controls.update();
        renderer.render(scene, camera);
      });
  } catch (err) {}
};

var fetchPoints = async function (cluster, depth) {
  try {
    await axios
      .post(
        "http://localhost:1107/points", {
          cluster: cluster,
          depth: depth
        }, {
          cancelToken: source.token
        }
      )
      .then(res => {
        for (let p of res.data.points) {
          if (currentPoint > MAX_POINTS) {
            currentPoint = basePointsCount;
            /*source.cancel('Point budget used up.');
                    return;*/
          }
          let positions = starField.geometry.attributes.position.array;
          let size = starField.geometry.attributes.size.array;
          size[currentPoint] = 0.01;
          positions[currentPoint * 3] = p.point[0];
          positions[currentPoint * 3 + 1] = p.point[2];
          positions[currentPoint * 3 + 2] = p.point[1];
          currentPoint++;
        }
        starField.geometry.attributes.position.needsUpdate = true;
        starField.geometry.attributes.size.needsUpdate = true;
        starField.geometry.setDrawRange(0, MAX_POINTS);
        controls.update();
        renderer.render(scene, camera);
      });
  } catch (err) {}
};

var fetchPointsBatch = async function (requests) {
  try {
    await axios
      .post(
        "http://localhost:1107/points/batch", {
          requests: requests
        }, {
          cancelToken: source.token
        }
      )
      .then(res => {
        currentPoint = basePointsCount;
        for (let p of res.data.points) {
          if (currentPoint > MAX_POINTS) {
            currentPoint = basePointsCount;
            /*source.cancel('Point budget used up.');
                    return;*/
          }
          let positions = starField.geometry.attributes.position.array;

          positions[currentPoint * 3] = p.point[0];
          positions[currentPoint * 3 + 1] = p.point[2];
          positions[currentPoint * 3 + 2] = p.point[1];
          currentPoint++;
          let size = starField.geometry.attributes.size.array;
          if (p.key.length == 6) {
            size[currentPoint] = 0.01;
          } else if (p.key.length == 5) {
            size[currentPoint] = 0.05;
          } else if (p.key.length == 4) {
            size[currentPoint] = 0.15;
          }


        }
        starField.geometry.attributes.position.needsUpdate = true;
        starField.geometry.attributes.size.needsUpdate = true;
        starField.geometry.setDrawRange(0, MAX_POINTS);
        controls.update();
        renderer.render(scene, camera);
      });
  } catch (err) {}
};

var goDeeper = async function (depth) {
  let batchSize = 30;
  let pnt = basePoints.slice();
  for (let p of pnt) {
    await fetchPoints(p.key, depth);
  }
  pnts = [];
};

var distancePoint = function (point) {
  return Math.sqrt(
    Math.pow(camera.position.x - point[0], 2) +
    Math.pow(camera.position.y - point[2], 2) +
    Math.pow(camera.position.z - point[1], 2)
  );
};

var distanceCamera = function () {
  return Math.sqrt(
    Math.pow(camera.position.x - prevLoc.x, 2) +
    Math.pow(camera.position.y - prevLoc.y, 2) +
    Math.pow(camera.position.z - prevLoc.z, 2)
  );
};

var medTimer = null;
var highTimer = null;
var renderCamera = async function () {
  let sorted = basePoints.sort((a, b) => {
    return distancePoint(a) - distancePoint(b)
  });
  clearTimeout(medTimer);
  clearTimeout(highTimer);



  await source.cancel("Camera moved");
  CancelToken = axios.CancelToken;
  source = CancelToken.source();

  let low = [];
  let med = [];
  let high = [];
  
  
  for (let p of sorted) {
    let vec = new THREE.Vector3(
      p.point[0] - camera.position.x,
      p.point[2] - camera.position.y,
      p.point[1] - camera.position.z
    );
    if (camera.getWorldDirection().dot(vec.normalize()) > 0.1) {
      dist = distancePoint(p.point);

      if (dist < 5) {
        high.push({
          cluster: p.key,
          depth: 3
        });
      } else if (dist < 10) {
        high.push({
          cluster: p.key,
          depth: 2
        });
        med.push({
          cluster: p.key,
          depth: 2
        });
      } else {
        high.push({
          cluster: p.key,
          depth: 1
        });
        med.push({
          cluster: p.key,
          depth: 1
        });
        low.push({
          cluster: p.key,
          depth: 1
        });
      }
    }
  }
  fetchPointsBatch(low);
  medTimer = setTimeout(function () {
    fetchPointsBatch(med);
  }, 300);
  highTimer = setTimeout(function () {
    fetchPointsBatch(high);
  }, 700);
};

var animate = function () {
  requestAnimationFrame(animate);
  controls.update();
  stats.update();
  let dist = distanceCamera();
  if (dist > 0.3 && autoFetch) {
    source.cancel("Camera moved");
    clearTimeout(timer);
    timer = setTimeout(renderCamera, 100);
    prevLoc = camera.position.clone();
  }
  renderer.render(scene, camera);
};

init();
fetchBasePoints();
animate();