const supabaseUrl = "https://esvbufmzaiphhnszcigm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYXV4cGtyY3dwZHR2ZXp4eGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjIyMTcsImV4cCI6MjA2Mjc5ODIxN30.SvjV6zh_rBJ94z9AXbbH5aqt2U-RAkoLzgAmuChKDK4";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let map, marker;

window.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    showApp();
    initMap();
    loadFishFinds();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("mainApp").style.display = "none";
}

function showApp() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("mainApp").style.display = "block";
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
  } else {
    showApp();
    initMap();
    loadFishFinds();
  }
}

async function logout() {
  await supabase.auth.signOut();
  showLogin();
}

function initMap() {
  if (map) return;
  map = L.map('map').setView([48.5, 10], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  map.on("click", function (e) {
    const { lat, lng } = e.latlng;
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;

    if (marker) marker.setLatLng(e.latlng);
    else marker = L.marker(e.latlng).addTo(map);
  });
}

async function saveFish(event) {
  event.preventDefault();

  const fishName = document.getElementById("fishname").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const files = document.getElementById("photos").files;

  const { data: { user } } = await supabase.auth.getUser();

  if (!lat || !lng || !fishName || !user) {
    alert("Bitte alle Felder ausfüllen und Ort wählen.");
    return;
  }

  const imageUrls = [];

  for (let file of files) {
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("fish-photos").upload(filePath, file);
    if (uploadError) {
      alert("Fehler beim Hochladen: " + uploadError.message);
      return;
    }
    const { data } = supabase.storage.from("fish-photos").getPublicUrl(filePath);
    imageUrls.push(data.publicUrl);
  }

  const { error } = await supabase.from("fish_finds").insert([{
    user_id: user.id,
    fish_name: fishName,
    lat,
    lng,
    images: imageUrls
  }]);

  if (error) {
    alert("Speichern fehlgeschlagen: " + error.message);
  } else {
    alert("Fisch gespeichert!");
    loadFishFinds();
  }
}

async function loadFishFinds() {
  const { data, error } = await supabase.from("fish_finds").select("*");
  if (error) return;

  data.forEach((find) => {
    L.marker([find.lat, find.lng])
      .addTo(map)
      .bindPopup(`<strong>${find.fish_name}</strong><br><small>${find.user_id}</small>`);
  });
}


