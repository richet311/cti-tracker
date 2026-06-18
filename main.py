#!/usr/bin/env python3
"""
CTI Tracker — Cyber Threat Intelligence Platform
=================================================
Demonstrates skills aligned with CrowdStrike GTAC internship requirements:

  collect          Pull live IOCs from MalwareBazaar & URLhaus
  analyze <ioc>    Enrich a hash / IP / domain / URL against threat intel
  ioc list/add     Browse and manually add indicators
  campaign *       Create campaigns, assign IOCs and TTPs
  ttp search/info  Browse MITRE ATT&CK techniques
  report generate  Produce finished Markdown intelligence reports
  stats            Show database totals

Usage examples
--------------
  python main.py collect
  python main.py analyze 44d88612fea8a8f36de82e1278abb02f
  python main.py analyze --flash 192.168.1.1
  python main.py campaign create "Operation NightShift" --actor "APT28" --motivation espionage
  python main.py campaign add-ioc 1 44d88612fea8a8f36de82e1278abb02f
  python main.py campaign add-ttp 1 T1059.001 --notes "PowerShell dropper"
  python main.py ttp search "powershell"
  python main.py report generate 1
  python main.py stats
"""

import os
import sys

# Force UTF-8 on Windows so Rich box-drawing / arrow characters don't crash.
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

import database.operations as db
from collectors import malwarebazaar, urlhaus
from collectors import mitre_attack
from analyzers.ioc_analyzer import analyze_ioc, detect_ioc_type
from analyzers.campaign_tracker import suggest_campaign, get_campaign_summary
from reporters.report_generator import generate_tactical_report, generate_flash_report
from config import REPORTS_DIR

console = Console()



def _init():
    db.init_db()



@click.group()
def cli():
    """CTI Tracker — Cyber Threat Intelligence Platform."""
    _init()



@cli.command()
@click.option(
    "--limit", default=20, show_default=True,
    help="Number of records to fetch per source."
)
@click.option(
    "--source",
    type=click.Choice(["malwarebazaar", "urlhaus", "all"]),
    default="all", show_default=True,
)
def collect(limit, source):
    """Fetch the latest IOCs from public threat intelligence feeds."""

    if source in ("malwarebazaar", "all"):
        console.rule("[bold cyan]MalwareBazaar[/bold cyan]")
        samples = malwarebazaar.get_recent_samples(limit)
        for s in samples:
            db.upsert_ioc(
                value=s.get("sha256_hash", ""),
                ioc_type="hash_sha256",
                malware_family=s.get("signature"),
                threat_type=s.get("file_type"),
                first_seen=s.get("first_seen"),
                last_seen=s.get("last_seen"),
                tags=s.get("tags") or [],
                source="malwarebazaar",
                raw_data=s,
            )
            if s.get("md5_hash"):
                db.upsert_ioc(
                    s["md5_hash"], "hash_md5",
                    malware_family=s.get("signature"),
                    source="malwarebazaar",
                )
        console.print(f"[green]Stored {len(samples)} samples.[/green]")

    if source in ("urlhaus", "all"):
        console.rule("[bold cyan]URLhaus[/bold cyan]")
        urls = urlhaus.get_recent_urls(limit)
        for u in urls:
            db.upsert_ioc(
                value=u.get("url", ""),
                ioc_type="url",
                threat_type=u.get("threat"),
                tags=u.get("tags") or [],
                first_seen=u.get("date_added"),
                source="urlhaus",
                raw_data=u,
            )
        console.print(f"[green]Stored {len(urls)} URLs.[/green]")

    console.print(
        "\n[bold green]Done.[/bold green] Run [cyan]python main.py stats[/cyan] to see totals."
    )



@cli.command()
@click.argument("ioc_value")
@click.option("--flash", is_flag=True, help="Also generate a Flash report.")
def analyze(ioc_value, flash):
    """
    Enrich an IOC (hash / IP / domain / URL) against live threat intel sources.

    The IOC is automatically saved to the local database so it can later
    be assigned to a campaign.
    """
    console.print(f"\n[bold]Analyzing:[/bold] {ioc_value}")
    ioc_type = detect_ioc_type(ioc_value)
    console.print(f"[dim]Detected type:[/dim] {ioc_type}\n")

    with console.status("Querying threat intelligence sources..."):
        result = analyze_ioc(ioc_value)

    # Persist
    db.upsert_ioc(
        value=ioc_value,
        ioc_type=ioc_type,
        malware_family=result.get("malware_family"),
        threat_type=result.get("threat_type"),
        tags=result.get("tags", []),
        first_seen=result.get("first_seen"),
        last_seen=result.get("last_seen"),
        source=", ".join(result.get("sources", ["manual"])) or "manual",
        raw_data=result.get("raw", {}),
    )

    if result["sources"]:
        table = Table(title="IOC Intelligence", header_style="bold magenta")
        table.add_column("Field", style="cyan", width=20)
        table.add_column("Value")
        table.add_row("Indicator",      ioc_value)
        table.add_row("Type",           ioc_type)
        table.add_row("Sources",        ", ".join(result["sources"]))
        table.add_row("Malware Family", result.get("malware_family") or "[dim]N/A[/dim]")
        table.add_row("Threat Type",    result.get("threat_type")    or "[dim]N/A[/dim]")
        table.add_row("Tags",           ", ".join(result.get("tags", [])) or "[dim]None[/dim]")
        table.add_row("First Seen",     result.get("first_seen") or "[dim]Unknown[/dim]")
        table.add_row("Last Seen",      result.get("last_seen")  or "[dim]Unknown[/dim]")
        console.print(table)

        suggestions = suggest_campaign(
            ioc_value,
            malware_family=result.get("malware_family"),
            tags=result.get("tags"),
        )
        if suggestions:
            console.print("\n[yellow]Possible campaign associations:[/yellow]")
            for cid, cname, reason in suggestions:
                console.print(f"  • Campaign #{cid} [{cname}] — {reason}")
            console.print(
                f"  Run: [cyan]python main.py campaign add-ioc <id> {ioc_value}[/cyan]"
            )
    else:
        console.print("[yellow]No matches found in threat intel sources.[/yellow]")
        console.print("[dim]IOC saved to local database for manual tracking.[/dim]")

    if flash and result["sources"]:
        _, content = generate_flash_report(ioc_value, result)
        safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in ioc_value[:30])
        out  = os.path.join(REPORTS_DIR, f"flash_{safe}.md")
        with open(out, "w", encoding="utf-8") as f:
            f.write(content)
        console.print(f"\n[bold green]Flash report saved:[/bold green] {out}")



@cli.group()
def ioc():
    """Manage tracked Indicators of Compromise."""


@ioc.command("list")
@click.option(
    "--type", "ioc_type", default=None,
    type=click.Choice(["hash_md5", "hash_sha256", "ip", "domain", "url"]),
)
@click.option("--limit", default=30, show_default=True)
def ioc_list(ioc_type, limit):
    """List IOCs stored in the local database."""
    rows = db.list_iocs(ioc_type=ioc_type, limit=limit)
    if not rows:
        console.print(
            "[yellow]No IOCs yet.[/yellow] Run [cyan]python main.py collect[/cyan] first."
        )
        return
    table = Table(title=f"IOCs ({len(rows)} shown)", header_style="bold cyan")
    table.add_column("ID",     width=5)
    table.add_column("Type",   width=14)
    table.add_column("Value",  width=60)
    table.add_column("Family", width=20)
    table.add_column("Source", width=14)
    for r in rows:
        table.add_row(
            str(r["id"]),
            r["ioc_type"],
            r["value"][:58],
            r.get("malware_family") or "[dim]-[/dim]",
            r.get("source")         or "[dim]-[/dim]",
        )
    console.print(table)


@ioc.command("add")
@click.argument("value")
@click.option("--family", default=None, help="Malware family name.")
@click.option("--type",   "ioc_type", default=None, help="Override auto-detected type.")
def ioc_add(value, family, ioc_type):
    """Manually add an IOC to the database."""
    if not ioc_type:
        ioc_type = detect_ioc_type(value)
    ioc_id = db.upsert_ioc(value, ioc_type, malware_family=family, source="manual")
    console.print(f"[green]Added IOC[/green] #{ioc_id} ({ioc_type}): {value}")



@cli.group()
def campaign():
    """Manage adversary campaigns."""


@campaign.command("list")
def campaign_list():
    """List all tracked campaigns."""
    rows = db.list_campaigns()
    if not rows:
        console.print(
            "[yellow]No campaigns yet.[/yellow] Create one with [cyan]campaign create[/cyan]."
        )
        return
    table = Table(title="Campaigns", header_style="bold magenta")
    table.add_column("ID",         width=5)
    table.add_column("Name",       width=28)
    table.add_column("Actor",      width=20)
    table.add_column("Motivation", width=14)
    table.add_column("IOCs",       width=6,  justify="right")
    table.add_column("TTPs",       width=6,  justify="right")
    table.add_column("Status",     width=10)
    for c in rows:
        table.add_row(
            str(c["id"]),
            c["name"],
            c.get("threat_actor") or "[dim]Unknown[/dim]",
            c.get("motivation", "unknown").title(),
            str(c.get("ioc_count", 0)),
            str(c.get("ttp_count", 0)),
            c.get("status", "active").title(),
        )
    console.print(table)


@campaign.command("create")
@click.argument("name")
@click.option("--actor",       default="",       help="Threat actor attribution.")
@click.option("--description", default="",       help="Free-text description.")
@click.option(
    "--motivation", default="unknown",
    type=click.Choice(["espionage", "financial", "disruptive", "hacktivism", "unknown"]),
)
def campaign_create(name, actor, description, motivation):
    """Create a new campaign to track a cluster of adversary activity."""
    cid = db.create_campaign(
        name, description=description, threat_actor=actor, motivation=motivation
    )
    console.print(f"[green]Created campaign[/green] #{cid} — {name}")


@campaign.command("view")
@click.argument("campaign_id", type=int)
def campaign_view(campaign_id):
    """Show full details of a campaign: IOCs, TTPs, and malware families."""
    summary = get_campaign_summary(campaign_id)
    if not summary:
        console.print(f"[red]Campaign #{campaign_id} not found.[/red]")
        return

    c = summary["campaign"]
    console.print(Panel(
        f"[bold]{c['name']}[/bold]\n"
        f"Actor: {c.get('threat_actor') or 'Unknown'}  |  "
        f"Motivation: {c.get('motivation', 'unknown').title()}  |  "
        f"Status: {c.get('status', 'active').title()}\n\n"
        f"{c.get('description') or '[dim]No description.[/dim]'}",
        title=f"Campaign #{campaign_id}",
    ))

    console.print(f"\n[cyan]IOCs:[/cyan] {summary['total_iocs']}")
    for itype, vals in summary["ioc_by_type"].items():
        console.print(f"  {itype}: {len(vals)}")

    if summary["malware_families"]:
        console.print(f"\n[cyan]Malware Families:[/cyan] {', '.join(summary['malware_families'])}")

    if summary["ttps"]:
        console.print(f"\n[cyan]TTPs ({len(summary['ttps'])}):[/cyan]")
        for entry in summary["ttps"]:
            console.print(
                f"  [{entry['technique_id']}] {entry.get('technique_name', '')} "
                f"({entry.get('tactic', '')})"
            )


@campaign.command("add-ioc")
@click.argument("campaign_id", type=int)
@click.argument("ioc_value")
@click.option("--notes", default="")
def campaign_add_ioc(campaign_id, ioc_value, notes):
    """Link an IOC to a campaign."""
    existing = db.get_ioc(ioc_value)
    if existing:
        ioc_id = existing["id"]
    else:
        ioc_id = db.upsert_ioc(ioc_value, detect_ioc_type(ioc_value), source="manual")

    db.add_ioc_to_campaign(campaign_id, ioc_id, notes=notes)
    console.print(f"[green]Linked IOC[/green] `{ioc_value}` -> campaign #{campaign_id}")


@campaign.command("add-ttp")
@click.argument("campaign_id", type=int)
@click.argument("technique_id")
@click.option("--notes", default="", help="Analyst notes about observed usage.")
def campaign_add_ttp(campaign_id, technique_id, notes):
    """
    Associate a MITRE ATT&CK technique with a campaign.

    Example: python main.py campaign add-ttp 1 T1059.001 --notes "PowerShell dropper"
    """
    t = mitre_attack.get_technique_by_id(technique_id)
    if t:
        db.add_ttp_to_campaign(
            campaign_id,
            t["id"],
            technique_name=t["name"],
            tactic=t["tactic"],
            notes=notes,
        )
        console.print(
            f"[green]Added TTP[/green] {t['id']} ({t['name']}) -> campaign #{campaign_id}"
        )
    else:
        db.add_ttp_to_campaign(campaign_id, technique_id, notes=notes)
        console.print(
            f"[yellow]TTP {technique_id} not in local ATT&CK cache — added manually.[/yellow]"
        )



@cli.group()
def ttp():
    """Browse and search the MITRE ATT&CK framework."""


@ttp.command("search")
@click.argument("keyword")
def ttp_search(keyword):
    """Full-text search across ATT&CK technique names and descriptions."""
    with console.status("Searching ATT&CK..."):
        results = mitre_attack.search_techniques(keyword)

    if not results:
        console.print(f"[yellow]No techniques found for '{keyword}'.[/yellow]")
        return

    table = Table(
        title=f"ATT&CK: '{keyword}' ({len(results)} results, showing 20)",
        header_style="bold yellow",
        show_lines=True,
    )
    table.add_column("ID",        width=14)
    table.add_column("Name",      width=38)
    table.add_column("Tactic",    width=30)
    table.add_column("Platforms", width=30)

    for t in results[:20]:
        table.add_row(t["id"], t["name"], t["tactic"], t["platforms"])

    console.print(table)


@ttp.command("info")
@click.argument("technique_id")
def ttp_info(technique_id):
    """Show full details for an ATT&CK technique (e.g. T1059 or T1059.001)."""
    t = mitre_attack.get_technique_by_id(technique_id)
    if not t:
        console.print(f"[red]Technique '{technique_id}' not found.[/red]")
        return

    console.print(Panel(
        f"[bold]{t['id']} — {t['name']}[/bold]\n\n"
        f"[cyan]Tactic:[/cyan]    {t['tactic']}\n"
        f"[cyan]Platforms:[/cyan] {t['platforms']}\n\n"
        f"{t['description']}",
        title="MITRE ATT&CK Technique",
    ))



@cli.group()
def report():
    """Generate and list finished intelligence reports."""


@report.command("generate")
@click.argument("campaign_id", type=int)
@click.option(
    "--tlp", default="TLP:WHITE",
    type=click.Choice(["TLP:WHITE", "TLP:GREEN", "TLP:AMBER", "TLP:RED"]),
)
def report_generate(campaign_id, tlp):
    """Generate a Tactical Intelligence Report for a campaign."""
    with console.status("Building report..."):
        title, content = generate_tactical_report(campaign_id, tlp=tlp)

    if not title:
        console.print(f"[red]{content}[/red]")
        return

    safe     = "".join(c if c.isalnum() or c in " -_" else "_" for c in title)[:60]
    out_path = os.path.join(REPORTS_DIR, f"{safe}.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)

    db.save_report(title, content, campaign_id=campaign_id, tlp=tlp)

    console.print(f"\n[bold green]Report saved:[/bold green] {out_path}")
    console.print("\n[bold]Preview:[/bold]")
    for line in content.split("\n")[:35]:
        console.print(line)


@report.command("list")
def report_list():
    """List all generated reports."""
    rows = db.list_reports()
    if not rows:
        console.print("[yellow]No reports yet.[/yellow]")
        return

    table = Table(title="Intelligence Reports", header_style="bold green")
    table.add_column("ID",       width=5)
    table.add_column("Title",    width=50)
    table.add_column("Campaign", width=22)
    table.add_column("TLP",      width=12)
    table.add_column("Date",     width=18)

    for r in rows:
        table.add_row(
            str(r["id"]),
            r["title"][:48],
            r.get("campaign_name") or "[dim]-[/dim]",
            r["tlp"],
            r["created_at"][:16],
        )
    console.print(table)



@cli.command()
def stats():
    """Show database statistics."""
    s = db.get_stats()

    console.print(Panel(
        f"[bold cyan]IOCs:[/bold cyan]      {s['total_iocs']}\n"
        f"[bold cyan]Campaigns:[/bold cyan] {s['total_campaigns']}\n"
        f"[bold cyan]Reports:[/bold cyan]   {s['total_reports']}",
        title="CTI Tracker — Database Stats",
    ))

    if s["ioc_types"]:
        t = Table(title="IOCs by Type", header_style="bold")
        t.add_column("Type")
        t.add_column("Count", justify="right")
        for row in s["ioc_types"]:
            t.add_row(row["ioc_type"], str(row["cnt"]))
        console.print(t)

    if s["top_families"]:
        t = Table(title="Top Malware Families", header_style="bold")
        t.add_column("Family")
        t.add_column("Count", justify="right")
        for row in s["top_families"]:
            t.add_row(row["malware_family"] or "[dim]Unknown[/dim]", str(row["cnt"]))
        console.print(t)



if __name__ == "__main__":
    cli()
