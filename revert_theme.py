import os
files = [
    "src/pages/portal/evote/AdminLoginPage.tsx",
    "src/pages/portal/evote/AdminDashboard.tsx",
    "src/pages/portal/evote/AdminManage.tsx",
    "src/pages/portal/evote/AdminCodes.tsx",
    "src/pages/portal/evote/AdminReports.tsx",
    "src/pages/portal/evote/AdminTimingPage.tsx"
]

for file in files:
    if not os.path.exists(file): continue
    with open(file, "r") as f:
        content = f.read()
    
    # Revert replacements
    content = content.replace("bg-slate-50", "bg-hero-gradient")
    content = content.replace("bg-white border border-slate-200 shadow-sm", "card-elevated")
    content = content.replace("bg-blue-600 hover:bg-blue-700 text-slate-900 shadow-sm", "gradient-primary text-white")
    
    # We replaced text-white with text-slate-900! Let's revert that.
    content = content.replace("text-slate-900", "text-white")
    content = content.replace("text-slate-700", "text-white/90")
    content = content.replace("text-slate-600", "text-white/80")
    
    # Revert background colors to highly visible white alpha for dark theme
    content = content.replace("bg-slate-100", "bg-white/20")
    # bg-slate-50 was already replaced with bg-hero-gradient, which is fine for the main bg, 
    # but maybe we missed some.
    
    # Revert borders
    content = content.replace("border-slate-300", "border-white/40")
    content = content.replace("border-slate-200", "border-white/30")
    content = content.replace("border-slate-100", "border-white/20")
    
    # Color the update button in AdminTimingPage.tsx
    if "AdminTimingPage.tsx" in file:
        content = content.replace('className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold"', 'className="w-full sm:w-auto px-6 py-2.5 rounded-xl gradient-primary text-white font-bold shadow-lg hover:brightness-110 transition-all"')
    
    with open(file, "w") as f:
        f.write(content)
