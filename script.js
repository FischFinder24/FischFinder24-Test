const supabaseUrl = "https://esvbufmzaiphhnszcigm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmJ1Zm16YWlwaGhuc3pjaWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODY1NzcsImV4cCI6MjA2Mjk2MjU3N30.bbGb6ucq04cSycYup7fS_PO9E9Z0UjBxVkqpizj4w-4";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let map, marker;

window.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Kein aktiver Login → Loginformular anzeigen
    showLogin();
  } else {
    // Bereits eingeloggt → sofort App anzeigen
    showApp();
    initMap();
    loadFishFinds();


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

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    alert("Registrierung fehlgeschlagen: " + error.message);
  } else {
    alert("Registrierung erfolgreich. Bitte überprüfe deine E-Mails zur Bestätigung.");
  } }
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
      .bindPopup(() => {
        const imageList = typeof find.images === "string"
          ? JSON.parse(find.images)
          : find.images;

        const imageHtml = Array.isArray(imageList)
          ? imageList.map(url => `
              <a href="${url}" target="_blank">
                <img src="${url}" style="max-width:100px; margin-top:5px;" />
              </a>
            `).join('')
          : '';

        return `
          <strong>${find.fish_name}</strong><br>
          ${imageHtml}
          <br>
          <button onclick="deleteFish('${find.id}')">🗑️ Löschen</button>
        `;
      });
  });
}

// Und jetzt AUSSERHALB:
async function deleteFish(id) {
  if (!confirm("Diesen Fund wirklich löschen?")) return;

  const { error } = await supabase
    .from("fish_finds")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Löschen fehlgeschlagen: " + error.message);
  } else {
    alert("Eintrag gelöscht!");
    loadFishFinds(); // Karte neu laden
  }
}
