# session-doc

Dokumentiere die aktuelle Entwicklungs-Session des ECOM Influencer Dashboards.
Läuft am **Ende jeder Session** — solange der Chat-Kontext noch vollständig vorhanden ist.

---

## Session-Mapping (Git-Commits)

| Session | Von-Commit | Bis-Commit | Kern-Inhalt |
|---------|-----------|-----------|-------------|
| #1 | 4cfb258 | ef71408 | Initial MVP + v2 SaaS Layout rebuild |
| #2 | 20406be | 51f29b1 | Vergütungsmodelle + Attribution tracking |
| #3 | 14343d0 | e185944 | Supabase live + Zod + Webhook + Risk-Score |
| #4 | 67d2340 | 67d2340 | Sprint 4A+4B: Skeleton, Error Boundaries, Influencer-Admin |
| #5 | b392d80 | 3de9890 | Influencer bearbeiten + Reaktivieren + CLAUDE.md |
| #6 | 4f9017c | 5f70b09 | Sprint 4C: Monatsabschluss + Excel-Export + Demo-Planung |

---

## Ausführungsregeln

- **Kompakt ausführen** — kein langer Output im Chat, nur die Bestätigung am Ende
- **Core-Schritte (1–5) sind unveränderlich** — Selbstverbesserung darf die Struktur der Dokumentation nicht ändern
- **Selbstverbesserung (Schritt 6) ist isoliert** — sie schreibt nur in `session-doc-state.md`, niemals in den Skill selbst
- **Verbesserungen aus State = Hinweise zur Qualität**, nicht Änderungen am Ablauf — z.B. "achte mehr auf X" aber nicht "überspringe Y"
- **Kein interaktiver Output** — der Skill fragt nichts, wartet nicht, gibt nur die Abschluss-Bestätigung aus

---

## Deine Aufgabe

Du erhältst optional eine Session-Nummer als Argument (z.B. `/session-doc 3`).

**Wenn keine Nummer angegeben:** Lies `session-doc-state.md` → nimm die "Nächste ausstehende Session" automatisch. Kein Nachfragen.

### Schritt 0 — State laden & Ausführung registrieren

Lies zuerst:
```
.claude/session-doc-state.md
```

Daraus entnimmst du:
- Wie viele Ausführungen bisher (N)
- Welche Sessions bereits dokumentiert sind
- Welche **Skill-Verbesserungen** aus vorherigen Ausführungen vorliegen → wende sie in dieser Ausführung an

Dann aktualisiere die Statistik:
- Ausführungen: N+1
- Sessions dokumentiert: füge aktuelle Session hinzu
- Letzte Ausführung: aktueller Timestamp
- Nächste ausstehende Session: N+1 (oder "alle dokumentiert" wenn #6)

Füge in den Ausführungs-Changelog eine neue Zeile ein:
```
| N+1 | #[Session] | [Ja/Nein — ob echter Chat-Kontext verfügbar war] | [Timestamp] | [Qualität: 1-5] | [Kurze Notiz] |
```

### Schritt 1 — Vorherigen Stand laden

Lies das Master-Dokument um zu verstehen was bereits dokumentiert ist:
```
/Users/abed.qadi/projects/Leon Ruddat Claude E-Commerce DACH/project-docs/master.md
```
Wenn Session #1: Erstelle das Dokument mit dem untenstehenden Header.

### Schritt 2 — Git-Analyse dieser Session

Ermittle Von- und Bis-Commit aus der Tabelle oben, dann:
```bash
cd "/Users/abed.qadi/projects/Leon Ruddat Claude E-Commerce DACH/influencer-dashboard"
git log --oneline VON^..BIS
git diff VON^ BIS --stat
git show BIS --stat
```
Lies die wichtigsten geänderten Dateien (types.ts, analytics.ts, neue Components, API Routes, CLAUDE.md).

### Schritt 3 — Chat-Konversation auswerten (WICHTIGSTE QUELLE)

Analysiere die aktuelle Chat-Konversation dieser Session. Extrahiere:

- **Entscheidungsdiskussionen:** Wo wurden Alternativen diskutiert? Was wurde abgelehnt und warum?
- **Anforderungsklärungen:** Was hat der User spezifiziert, präzisiert oder korrigiert?
- **Planungsänderungen:** Was wurde umgeplant, priorisiert oder zurückgestellt?
- **Technische Erkenntnisse:** Was wurde während der Entwicklung entdeckt?
- **Korrekturen:** Wo hat der User etwas richtiggestellt — das zeigt was wichtig ist?

> Diese Quelle enthält das *Warum* hinter Entscheidungen — das steht weder im Git noch in CLAUDE.md.

### Schritt 4 — Abschnitt erstellen

Erstelle einen Abschnitt mit diesem Format:

```markdown
---

## Session #N — [Titel]
**Datum:** [aus git log]  
**Commits:** [Von-Hash] → [Bis-Hash]  
**Dauer:** ca. [aus Timestamps schätzen]

### Was wurde gebaut
[Feature-Liste — aus git diff]

### Architektur-Entscheidungen
Für jede wichtige Entscheidung in dieser Session:

**[Entscheidungsname]**
- Was: [konkret was implementiert wurde]
- Warum: [Begründung — aus Chat-Kontext, nicht aus Code]
- Verworfen: [Alternativen die diskutiert aber abgelehnt wurden]
- Trade-off: [Was bewusst nicht gemacht wurde]

### Anforderungen & Klärungen (aus Chat)
[Was der User in dieser Session spezifiziert, korrigiert oder präzisiert hat —
diese Punkte zeigen die echten Produkt-Entscheidungen hinter dem Code]

### KI-Workflow
- **Claude Code eingesetzt für:** [Code schreiben, Refactoring, Debugging, Planung]
- **Menschliche Entscheidungen:** [Was der Entwickler entschieden hat — Produktrichtung, Priorisierung, Architektur-Rahmen]
- **Iterationen & Korrekturen:** [Wo musste nachgebessert werden, was wurde zurückgewiesen]

### Gelöste Probleme
[Problem → Lösungsansatz → Ergebnis]

### Wiederverwendbare Patterns
[Patterns die in anderen Projekten direkt übernommen werden können — mit Code-Referenz]

### Offene Punkte nach dieser Session
[Was wurde bewusst zurückgestellt oder für die nächste Session geplant]
```

### Schritt 5 — Master-Dokument aktualisieren

Füge den Abschnitt in master.md ein — **nie überschreiben, immer anhängen**.

Pfad: `/Users/abed.qadi/projects/Leon Ruddat Claude E-Commerce DACH/project-docs/master.md`

Nach Session #6: Ergänze zusätzlich die drei Abschnitte am Ende:
- "Gesamtbild: Architektur-Entscheidungen" — Querschnitt über alle Sessions
- "KI-Workflow: Wie Claude Code eingesetzt wurde" — Gesamtbild
- "Wiederverwendbare Patterns (Extrakt)" — die wichtigsten Patterns aller Sessions

### Schritt 6 — Skill-Reflexion & Selbstverbesserung

Bevor du abschließt: reflektiere diese Ausführung und trage in `session-doc-state.md` ein:

**Erkannte Verbesserungen** (falls vorhanden):
- Was hätte ich in dieser Ausführung besser dokumentieren können?
- Welche Informationen aus dem Chat-Kontext habe ich übersehen oder unterschätzt?
- Gibt es ein Muster in den Entscheidungen dieser Session das ich beim nächsten Mal gezielter suchen sollte?
- Hat sich das Format bewährt oder sollte ein Abschnitt angepasst werden?

Format für den Eintrag:
```markdown
### Nach Ausführung #N (Session #X) — [Timestamp]
- [Beobachtung 1 → konkrete Verbesserung für nächste Ausführung]
- [Beobachtung 2 → ...]
```

**Erkannte Muster** (falls ein Pattern sich wiederholt):
- Wenn dasselbe Muster in ≥2 Sessions auftaucht → unter "Erkannte Muster" eintragen
- Format: `[Pattern-Name]: [Beschreibung] — gesehen in Sessions: [#X, #Y]`

### Schritt 7 — Bestätigung ausgeben

```
╔══════════════════════════════════════════════╗
║  session-doc — Ausführung #N abgeschlossen   ║
╠══════════════════════════════════════════════╣
║  Session dokumentiert : #X                   ║
║  Chat-Kontext genutzt : Ja / Nein            ║
║  master.md aktualisiert : ✓                  ║
║  State aktualisiert : ✓                      ║
║  Verbesserungen erkannt : [Anzahl]           ║
╠══════════════════════════════════════════════╣
║  Nächste Session : #X+1                      ║
║  → Öffne Chat #X+1 → /session-doc X+1       ║
╚══════════════════════════════════════════════╝
```

---

## Master-Dokument Header (nur bei Session #1 erstellen)

```markdown
# ECOM Influencer Dashboard — Gesamtdokumentation

**Projekt:** Influencer Attribution Dashboard für DACH E-Commerce  
**Zeitraum:** 9.–10. April 2026  
**Besonderheit:** Gesamtes Projekt (MVP → Production) in ~24h gebaut  
**Stack:** Next.js 16 App Router · TypeScript strict · Tailwind · Recharts · Supabase · Shopify Webhooks · Vercel · SheetJS  
**Repo:** https://github.com/Tools00/ECOM-influencer-dashboard  
**Live:** https://influencer-dashboard-wine.vercel.app  
**Kernproblem gelöst:** Meta Ads nutzen dieselben Rabattcodes wie Influencer → Attribution-Overlap.
Dashboard trennt Umsatz-Quellen und berechnet konservative/neutrale/liberale Revenue-Szenarien.

---
```
