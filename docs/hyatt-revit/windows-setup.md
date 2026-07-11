# Windows / Revit machine — Steps 1–3 (run on the Windows box)

These steps **cannot** be run from the Claude Code web session (Linux cloud sandbox). Run them in the Claude Code instance and browser **on your Windows machine** (`C:\Users\michaelglivar\...`), where Revit 2027, the deployed add-in, and your connected Google Drive live.

---

## Step 1 — Get the BASE4 `.rvt` onto the machine (browser download)

Preferred, safest method (native download — no base64/paste):

1. On the Windows box, open a browser and go to **drive.google.com**, signed in as **michaelglivar1@gmail.com**.
2. Locate the BASE4 Hyatt Place editable **`.rvt`** (search `type:` won't match; search the file name, or open the shared folder from BASE4).
3. Right-click the file → **Download**.
4. When the browser save dialog appears, save it into:
   ```
   C:\Users\michaelglivar\RevitAI\
   ```
5. If Drive wraps it in a `.zip` (it does this for large single files sometimes), extract the `.rvt` out of the zip into that same folder afterward.
6. Verify the file is there and non-trivial in size (a real BASE4 model will be tens–hundreds of MB, not a few KB):
   ```powershell
   Get-Item "C:\Users\michaelglivar\RevitAI\*.rvt" | Select-Object Name, Length, LastWriteTime
   ```

> Do **not** transfer by base64-encoding + pasting into a sandbox — that tripped the safety block last time. Native browser download only.

---

## Step 2 — Register the bridge as an MCP server (in Windows Claude Code)

In the Claude Code CLI running **on Windows**:

```
claude mcp add rvt-mcp "C:\Users\michaelglivar\RevitAI\dist\server\RvtMcp.Server.exe" --args "--target" "2027"
```

If your Claude Code version wants explicit scope, add `--scope user` (persists across projects) or `--scope local`.

Then confirm the tools are visible:

```
/mcp
```

You should see `rvt-mcp` listed as **connected** and its ~216 Revit commands available (create_wall/floor/level/room, doors/windows, views, schedules, sheets, plus your added create_roof / save_as / set_view_display_style). The disabled delete + arbitrary-code tools should **not** appear.

Sanity checks if it doesn't connect:
- The `.exe` path is exact and the file exists.
- Revit 2027 is installed and the add-in is deployed at `%APPDATA%\Autodesk\Revit\Addins\2027\RvtMcp\`.
- The named-pipe token the server expects matches the add-in's (from the prior session's config).

---

## Step 3 — Open the model + verify the bridge is live

1. Launch **Revit 2027** and open the `.rvt` downloaded in Step 1 (the real BASE4 model — *not* `Hyatt_Concept.rvt`, which is just massing boxes).
2. In the Windows Claude Code session, ask it to exercise a **read-only** command first to confirm the pipe is live, e.g.:
   - list open documents / instances
   - count walls, or list levels
3. Expected: it returns a non-empty count/list from the real model (levels for 4 floors, a real wall count, real rooms). If read-only commands succeed, the token-secured pipe is connected and you're ready to author changes.

Once Step 3 returns real data, the concept edits (adding Level 5, rooftop pool deck, etc.) can be scripted against the model.
