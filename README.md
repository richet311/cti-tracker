# CTI Tracker

CTI Tracker is a local cyber threat intelligence workspace for collecting indicators of compromise, enriching them with public threat feeds, mapping activity to MITRE ATT&CK, tracking campaigns, and generating Markdown intelligence reports.

## Features

- Collect recent malware hashes from MalwareBazaar and malicious URLs from URLhaus.
- Analyze hashes, IP addresses, domains, and URLs from the command line.
- Search MITRE ATT&CK techniques and attach TTPs to campaigns.
- Store IOCs, campaigns, TTP links, and reports in a local SQLite database.
- Generate tactical and flash-style Markdown reports.
- Run a FastAPI backend and Next.js dashboard for a visual workflow.

## Project Structure

```text
cti-tracker/
  analyzers/      IOC enrichment and campaign suggestion logic
  api/            FastAPI backend and WebSocket collection endpoint
  collectors/     MalwareBazaar, URLhaus, and MITRE ATT&CK collectors
  database/       SQLite schema and CRUD operations
  frontend/       Next.js dashboard
  reporters/      Markdown report generation
  data/           Local SQLite database and ATT&CK cache
  reports/        Generated intelligence reports
  main.py         CLI entry point
```

## Requirements

- Python 3.10+
- Node.js 18+ for the dashboard
- Internet access for live feed collection and first-time MITRE ATT&CK cache download

## Setup

Create a virtual environment and install the Python dependencies:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Install the frontend dependencies:

```bash
cd frontend
npm install
```

## CLI Usage

Run commands from the project root.

Collect recent IOCs from MalwareBazaar and URLhaus:

```bash
python main.py collect --limit 20
```

Analyze a single IOC:

```bash
python main.py analyze 44d88612fea8a8f36de82e1278abb02f
```

Create a campaign and link an IOC:

```bash
python main.py campaign create "Operation NightShift" --actor "APT28" --motivation espionage
python main.py campaign add-ioc 1 44d88612fea8a8f36de82e1278abb02f
```

Search MITRE ATT&CK and add a technique:

```bash
python main.py ttp search powershell
python main.py campaign add-ttp 1 T1059.001 --notes "PowerShell execution"
```

Generate a Markdown report:

```bash
python main.py report generate 1 --tlp TLP:WHITE
```

View database totals:

```bash
python main.py stats
```

## Dashboard Usage

Start the FastAPI backend from the project root:

```bash
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

In a second terminal, start the Next.js dashboard:

```bash
cd frontend
npm run dev
```

Open the dashboard at:

```text
http://localhost:3000
```

The frontend expects the API at `http://localhost:8000`.

## Data and Reports

- `data/cti_tracker.db` stores the local SQLite database.
- `data/mitre_attack_cache.json` stores the downloaded MITRE ATT&CK STIX cache.
- `reports/` stores generated Markdown intelligence reports.

These files are local working data. If you publish the project, consider whether you want to commit sample data or keep generated data out of version control.

## Optional API Keys

The basic collection commands use public CSV feeds where possible. Some direct lookup features require free abuse.ch API keys:

```cmd
set BAZAAR_API_KEY=your_key_here
set URLHAUS_API_KEY=your_key_here
```

PowerShell users can set them for the current session with:

```powershell
$env:BAZAAR_API_KEY = "your_key_here"
$env:URLHAUS_API_KEY = "your_key_here"
```

## License

This project is licensed under the MIT License. See `LICENSE` for details.

Threat intelligence data from MITRE ATT&CK, MalwareBazaar, and URLhaus remains governed by each source's own terms and usage policies.

## Suggested GitHub Description

Local cyber threat intelligence platform for collecting IOCs, mapping activity to MITRE ATT&CK, tracking campaigns, and generating Markdown reports.
