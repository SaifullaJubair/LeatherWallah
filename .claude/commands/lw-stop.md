---
description: Stop all 3 LeatherWallah dev servers (backend 5000, admin 3001, frontend 3005)
---

Kill whatever is listening on the LeatherWallah dev ports **5000, 3001, 3005** and nothing else. Use the **PowerShell** tool (this is a Windows machine):

```powershell
5000,3001,3005 | ForEach-Object { $p=(Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue).OwningProcess; if($p){ Stop-Process -Id $p -Force; "killed $_ (pid $p)" } else { "$_ not running" } }
```

Then report which ports were killed vs not-running.

Notes:
- Only touches ports 5000/3001/3005 — the owner runs **other projects on 3000 / 5050** on the same machine; never kill those.
- After this, `/lw-start` (or the individual commands in it) brings them back.
