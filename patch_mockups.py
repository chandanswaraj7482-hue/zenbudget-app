import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# 1. Fix the main mockup card container
content = content.replace(
    "background: isDark ? '#0d130f' : '#111827', color: '#f8fafc'",
    "background: isDark ? '#0d130f' : '#ffffff', color: isDark ? '#f8fafc' : '#0f172a'"
)

# 2. Fix the inner cards inside the mockups that use rgba(255,255,255,0.04) etc.
# We want to replace 'rgba(255,255,255,' with 'rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},' 
# BUT we have to be careful since these are string literals right now: 'rgba(255,255,255,0.04)' 
# We need to change them to template literals: `rgba(${isDark ? 255 : 0}, ${isDark ? 255 : 0}, ${isDark ? 255 : 0}, 0.04)`

def replacer(match):
    opacity = match.group(1)
    return f"`rgba(${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},{opacity})`"

content = re.sub(r"'rgba\(255,255,255,([0-9.]+)\)'", replacer, content)

def replacer_border(match):
    opacity = match.group(1)
    return f"`1px solid rgba(${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},{opacity})`"

content = re.sub(r"'1px solid rgba\(255,255,255,([0-9.]+)\)'", replacer_border, content)
content = re.sub(r"'1px dashed rgba\(255,255,255,([0-9.]+)\)'", lambda m: f"`1px dashed rgba(${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},${{isDark ? 255 : 0}},{m.group(1)})`", content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)

print("Mockups patched!")
