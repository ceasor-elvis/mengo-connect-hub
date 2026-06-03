import os
files = [
    "src/pages/portal/evote/AdminManage.tsx",
    "src/pages/portal/evote/AdminCodes.tsx",
    "src/pages/portal/evote/AdminReports.tsx",
    "src/pages/portal/evote/AdminDashboard.tsx"
]

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    content = content.replace("hover:bg-muted/60", "hover:bg-white/10")
    content = content.replace("hover:bg-muted/30", "hover:bg-white/5")
    content = content.replace("bg-muted/60", "bg-white/10")
    content = content.replace("bg-muted/50", "bg-white/5")
    content = content.replace("bg-muted/40", "bg-white/5")
    content = content.replace("bg-muted/30", "bg-white/5")
    content = content.replace("hover:bg-muted", "hover:bg-white/20")
    content = content.replace("bg-muted", "bg-white/10")
    
    with open(file, "w") as f:
        f.write(content)
