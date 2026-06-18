import os
files = [
    "src/pages/portal/evote/AdminLoginPage.tsx",
    "src/pages/portal/evote/AdminDashboard.tsx",
    "src/pages/portal/evote/AdminManage.tsx",
    "src/pages/portal/evote/AdminCodes.tsx",
    "src/pages/portal/evote/AdminReports.tsx"
]

replacements = {
    "bg-hero-gradient": "bg-slate-50",
    "card-elevated": "bg-white border border-slate-200 shadow-sm",
    "gradient-primary": "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    "gradient-accent": "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    "text-white/90": "text-slate-700",
    "text-white/70": "text-slate-600",
    "text-white": "text-slate-900",
    "bg-white/30": "bg-slate-100",
    "bg-white/20": "bg-slate-50",
    "hover:bg-white/40": "hover:bg-slate-100",
    "bg-white/10": "bg-white",
    "border-white/40": "border-slate-300",
    "border-white/30": "border-slate-200",
    "border-white/20": "border-slate-100",
    "text-primary-foreground": "text-white",
    "text-foreground": "text-slate-900",
    "bg-foreground/40": "bg-slate-900/50",
    "bg-primary/5": "bg-blue-50"
}

for file in files:
    with open(file, "r") as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file, "w") as f:
        f.write(content)
