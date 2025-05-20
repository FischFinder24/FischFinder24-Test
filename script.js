// Supabase-Client initialisieren
const supabaseUrl = "https://esvbufmzaiphhnszcigm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdmJ1Zm16YWlwaGhuc3pjaWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczODY1NzcsImV4cCI6MjA2Mjk2MjU3N30.bbGb6ucq04cSycYup7fS_PO9E9Z0UjBxVkqpizj4w-4"; // 
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// Beim Laden prüfen, ob User schon eingeloggt ist
window.addEventListener("DOMContentLoaded", async () => {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
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

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert("Login fehlgeschlagen: " + error.message);
    console.error(error);
  } else {
    alert("Login erfolgreich!");
    showFishForm();
  }
}

async function logout() {
  await supabaseClient.auth.signOut();
  alert("Abgemeldet.");
  showLoginForm();
}

async function saveFish() {
  const fishName = document.getElementById("fishname").value;
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    alert("Nicht eingeloggt!");
    return;
  }

  const { error, data } = await supabaseClient.from("fish_finds").insert([
    {
      user_id: user.id,
      fish_name: fishName,
      lat,
      lng,
    },
  ]);

  if (error) {
    alert("Fehler beim Speichern: " + error.message);
    console.error(error);
  } else {
    alert("Fisch gespeichert!");
    document.getElementById("fishname").value = "";
    document.getElementById("lat").value = "";
    document.getElementById("lng").value = "";
  }
}


