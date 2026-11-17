SPEED TYPER ONLINE — ANLEITUNG

WAS IST ENTHALTEN?
- index.html, style.css und app.js: das Spiel
- Räume mit 6-stelligem Spielcode
- Spieler-Präsenz und Live-Fortschritt über Supabase Realtime
- Tipp-Rennen mit WPM, Genauigkeit und Fortschritt

WICHTIG: ONLINE-VERBINDUNG EINRICHTEN
1. Öffne https://supabase.com und erstelle ein kostenloses Projekt.
2. Öffne im Supabase-Dashboard Project Settings → API.
3. Kopiere die Project URL und den öffentlichen Publishable Key (oder anon public key).
4. Öffne deine veröffentlichte Speed-Typer-Seite.
5. Tippe oben auf „Verbindung“ und füge URL und Key ein.
6. Speichern. Danach können Spieler von verschiedenen Geräten aus Räume erstellen und mit dem 6-stelligen Code beitreten.

SUPABASE REALTIME
Im Supabase-Dashboard muss Realtime verfügbar/aktiv sein. Das Spiel nutzt Supabase Realtime Channels mit Presence und Broadcast; es braucht keine Datenbanktabellen und kein SQL-Skript.

GITHUB PAGES
Lade alle drei Dateien (index.html, style.css, app.js) in den Stammordner (root) deines GitHub-Repositorys. GitHub Pages muss auf Branch main und /(root) eingestellt sein.

SICHERHEIT
- Trage ausschließlich Project URL und öffentlichen Publishable-/anon-Key ein.
- Verwende niemals service_role oder einen Secret-Key im Browser.
- Dies ist ein kleines Browser-Spiel-Demo. Spielcodes sind zufällig und Räume bestehen, solange die Spieler verbunden sind.
- Für ein öffentliches Turnier mit Schutz vor manipulierten Ergebnissen wäre zusätzliche serverseitige Prüfung nötig.

BEDIENUNG
Raum erstellen: Namen eingeben → Raum erstellen → Code teilen → Rennen starten.
Beitreten: Namen und 6-stelligen Code eingeben → Beitreten.
