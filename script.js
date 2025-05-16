const supabase = supabase.createClient(
  "https://esvbufmzaiphhnszcigm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // anonymen Key hier einfügen
);

// Prüfe Login-Status beim Laden der Seite
window.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    showFishForm();
  } else {
    showLoginForm();
  }
});

function showLoginForm() {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("fishForm").style.display = "none";
}

function showFishForm() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("fishForm").style.display = "block";
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
  } else {
    alert("Login erfolgreich!");
    showFishForm();
  }
}

async function logout() {
  await supabase.auth.signOut();
  alert("Abgemeldet.");
  showLoginForm();
}

async function saveFish() {
  const fishName = document.getElementById("fishname").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("Nicht eingeloggt!");
    return;
  }

  const { error, data } = await supabase.from("fish_finds").insert([
    {
      user_id: user.id,
      fish_name: fishName,
      lat,
      lng,
    },
  ]);

  if (error) {
    alert("Fehler beim Speichern: " + error.message);
  } else {
    alert("Fisch gespeichert!");
    document.getElementById("fishname").value = "";
    document.getElementById("lat").value = "";
    document.getElementById("lng").value = "";
  }
}

