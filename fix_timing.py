import os
file = "src/pages/portal/evote/AdminTimingPage.tsx"

if os.path.exists(file):
    with open(file, "r") as f:
        content = f.read()
    
    content = content.replace("text-muted-foreground", "text-white/80")
    content = content.replace("bg-muted/60", "bg-white/20")
    content = content.replace("bg-muted/50", "bg-white/20")
    content = content.replace("bg-muted", "bg-white/20")
    content = content.replace("hover:bg-muted", "hover:bg-white/30")
    content = content.replace("text-primary-foreground", "text-white")
    
    with open(file, "w") as f:
        f.write(content)
