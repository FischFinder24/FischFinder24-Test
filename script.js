document.addEventListener("DOMContentLoaded", () => {
  // Deckblatt-Logik
  const startButton = document.getElementById("start-button");
  startButton.addEventListener("click", () => {
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("auth").style.display = "block";
  });
});

// Supabase-Initialisierung
const supabaseUrl = 'https://xnauxpkrcwpdtvezxxfj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYXV4cGtyY3dwZHR2ZXp4eGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjIyMTcsImV4cCI6MjA2Mjc5ODIxN30.SvjV6zh_rBJ94z9AXbbH5aqt2U-RAkoLzgAmuChKDK4';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Registrierung
document.getElementById("signup").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) alert(error.message);
  else alert("Registrierung erfolgreich! Bitte E-Mail bestätigen.");
};

// Login
document.getElementById("login").onclick = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) alert(error.message);
  else {
    alert("Eingeloggt!");
    document.getElementById("map").style.display = "block";
    document.getElementById("logout").style.display = "inline-block";
    initMap();
  }
};

// Logout
document.getElementById("logout").onclick = async () => {
  await supabase.auth.signOut();
  location.reload();
};

// Karte initialisieren
async function initMap() {
  const map = L.map('map').setView([51.1657, 10.4515], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap-Mitwirkende'
  }).addTo(map);

  map.on('click', async function (e) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      alert("Bitte einloggen, um Funde zu dokumentieren.");
      return;
    }

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const fishName = prompt("Welchen Fisch hast du hier gefunden?");
    if (!fishName) return;

    L.marker([lat, lng]).addTo(map)
      .bindPopup(`${fishName} hier gefunden`)
      .openPopup();

    await supabase.from("fish_finds").insert([
      { user_id: user.data.user.id, fish_name: fishName, lat, lng }
    ]);
  });

  const { data: finds } = await supabase.from("fish_finds").select("*");
  finds.forEach(f => {
    L.marker([f.lat, f.lng]).addTo(map)
      .bindPopup(`${f.fish_name} (von Nutzer)`);
  });
}
