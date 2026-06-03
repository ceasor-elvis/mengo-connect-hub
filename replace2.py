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
    
    # Increase text opacity
    content = content.replace("text-white/70", "text-white/90")
    
    # Increase bg opacity
    content = content.replace("bg-white/10", "bg-white/30")
    content = content.replace("bg-white/5", "bg-white/20")
    content = content.replace("hover:bg-white/20", "hover:bg-white/40")
    
    # Fix borders if they use border-border which might be dark
    content = content.replace("border-border/60", "border-white/30")
    content = content.replace("border-border/50", "border-white/30")
    content = content.replace("border-border/40", "border-white/20")
    content = content.replace("border-border/30", "border-white/20")
    content = content.replace("border-border", "border-white/40")
    
    with open(file, "w") as f:
        f.write(content)
