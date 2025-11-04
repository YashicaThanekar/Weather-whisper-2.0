//tells which html page is currently open--> about ya fir index
const currentPage = window.location.pathname.split("/").pop();

//agar index page open hai to ye code chalega
if (currentPage === "index.html" || currentPage === "") {
  //globe.gl library ko use karne ke liye
  const GlobeLib = window.Globe;

//html mai jo id hai unko access karne ke liye
  const globeContainer = document.getElementById('globeContainer');
  const mapContainer = document.getElementById('map');
  const customZoomControls = document.getElementById('customZoomControls');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  
//initially map ko hide karne ke liye kyuki pehle globe dikhana hai
  mapContainer.style.display = 'none';

  // Create the globe
  const globe = GlobeLib()(globeContainer)
    .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')//globe ko texture add karne ke liye
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png');//globe ko 3d effect dene ke liye

  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.8;

//scene is to add star background
  const scene = globe.scene();

  const starGeometry = new THREE.BufferGeometry();//3D container ke andar star banane ke liye
  const starCount = 10000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {   //randomly star ki position set karne ke liye
    starPositions[i] = (Math.random() - 0.5) * 4000;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff, //star ka color
    size:0.7,  //star ka size
    transparent: true //transparency dene ke liye
  });

  const stars = new THREE.Points(starGeometry, starMaterial); //sare properties ko combine karne ke liye
  scene.add(stars);  //actually scene me star add karne ke liye

  // ---------- LEAFLET MAP SETUP ----------
  let map;
  function initMap(lat, lon, zoom = 10) { 
    if (map) {
      // Clear all layers from previous search
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Popup) {
          map.removeLayer(layer);
        }
      });
      map.setView([lat, lon], zoom); //view ko update karne ke liye
      map.invalidateSize(); //map barabarse dikhane ke liye
      return;
    }
    map = L.map('map', {
      zoomControl: false, //default zoom control ko hatane ke liye
      minZoom: 1,
      maxZoom: 19
    });
    map.setView([lat, lon], zoom); //view ko update karne ke liye

    //Zoom buttons
    zoomInBtn.onclick = () => map.zoomIn(); 
    zoomOutBtn.onclick = () => map.zoomOut();

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    
    //+ to zoom in and - to zoom out using keyboard,also can use arrow keys
    map.keyboard.enable();

    map.on('locationfound', (e) => {
      const radius = e.accuracy / 2;
      L.marker(e.latlng).addTo(map)
        .bindPopup(`You are within ${radius.toFixed(1)} meters from this point`);
      L.circle(e.latlng, radius).addTo(map);
    });
    map.on('locationerror', () => {
      alert("Location access denied. You can manually enter your location!");
    });
  }

  //Weather API
  const apiKey = "997fb135a47a50ec128696e87fc8272e";
  const input = document.querySelector(".input");
  const button = document.querySelector(".input-button");
  const mainContent = document.querySelector(".main-content");
  const inputSection = document.querySelector(".main-input");

  // Store original button text
  const originalButtonText = button.textContent;
  let isLoading = false; 

//loading ka function
  function startLoading() {
    isLoading = true;
    button.classList.add("loading");
    button.disabled = true;
    button.textContent = "";
    
    // Create wind loader
    const windLoader = document.createElement("div");
    windLoader.className = "wind-loader active";
    windLoader.innerHTML = `
      <div class="wind-line"></div>
      <div class="wind-line"></div>
      <div class="wind-line"></div> 
    `;
    button.appendChild(windLoader);
    
    // Add text next to loader
    const loaderText = document.createElement("span");
    loaderText.textContent = "Loading";
    loaderText.style.marginLeft = "8px";
    button.appendChild(loaderText);
  }

  function stopLoading() {
    isLoading = false;
    button.classList.remove("loading");
    button.disabled = false;
    button.textContent = originalButtonText;
  }

  function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("City not found");
        return res.json();
      })
      .then(data => {
        const { name, main, weather, coord } = data;
        const popupText = `
          <b>${name}</b><br>
          🌡️ Temp: ${main.temp} °C<br>
          ☁️ Condition: ${weather[0].description}<br>
          💨 Wind Speed: ${data.wind.speed} m/s<br>
          🌇 Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}<br>
          🌅 Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
        `;
        zoomToLocation(coord.lat, coord.lon, popupText);
      })
      .catch(err => {
        alert(err.message);
        stopLoading();
      });
  }

  // transition animation function
  function triggerAnimation() {
    mainContent.classList.add("active");
    inputSection.classList.add("fixed");
  }

  function zoomToLocation(lat, lon, popupText) {
    globe.pointOfView({ lat, lng: lon, altitude: 1.2 }, 1500);

    setTimeout(() => {
      globeContainer.style.transition = "opacity 1s ease-in-out";
      globeContainer.style.opacity = "0";

      setTimeout(() => {
        globeContainer.style.display = "none";
        mapContainer.style.display = "block";
        mapContainer.style.opacity = "0";
        mapContainer.style.transition = "opacity 1s ease-in-out";
        setTimeout(() => mapContainer.style.opacity = "1", 50);

        initMap(lat, lon, 10);
        L.marker([lat, lon]).addTo(map).bindPopup(popupText).openPopup();

        // Show custom zoom controls
        customZoomControls.classList.add("active");

        // Stop loading after map is fully displayed
        stopLoading();

      }, 1000);
    }, 1500);
  }

  //input logic
  button.addEventListener("click", () => {
    const city = input.value.trim();
    if (!city) {
      alert("Please enter a city name!");
      return;
    }
    triggerAnimation();
    startLoading();
    getWeather(city);
  });

  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const city = input.value.trim();
      if (!city) {
        alert("Please enter a city name!");
        return;
      }
      triggerAnimation();
      startLoading();
      getWeather(city);
    }
  });
}


// about page ke liye ye code chalega

if (currentPage === "about.html") {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = 0;
  container.style.left = 0;
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const starGeometry = new THREE.BufferGeometry();
  const starCount = 10000;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount * 3; i++) {
    starPositions[i] = (Math.random() - 0.5) * 4000;
  }
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, transparent: true });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  camera.position.z = 1000;

  function animate() {
    requestAnimationFrame(animate);
    stars.rotation.y += 0.0005;
    stars.rotation.x += 0.0003;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
