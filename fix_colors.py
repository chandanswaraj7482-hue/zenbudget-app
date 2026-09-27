import re

with open('src/components/LandingPage.tsx', 'r') as f:
    content = f.read()

# Fix the mobile menu background
content = content.replace(
    "background: isDark ? 'rgba(18,25,20,0.95)' : `rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},0.95)`",
    "background: isDark ? 'rgba(18,25,20,0.95)' : 'rgba(255,255,255,0.95)'"
)

# Fix the overlay cards (like Smart Budget Templates)
# They might be using something like: background: isDark ? `rgba(..., 0.8)` : `rgba(${isDark ? 255 : 0}..., 0.8)`
# Let's just find the generic pattern where opacity is > 0.4 and fix it.
# Actually, the safest way is to just replace ALL `rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},X)`
# Wait, if X is small (e.g. 0.05), black is fine in light mode.
# If X is large (e.g. 0.8), black is BAD in light mode.

# Let's just replace all `rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},` with `rgba(0,0,0,` which is what it evaluates to anyway in light mode!
# Wait, NO. The expression is inside a template literal.
# `rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},0.9)`
# In light mode (isDark=false), this evaluates to rgba(0,0,0,0.9) - very dark!
# If we change it to 'rgba(0,0,0,0.05)' for borders it's fine.
# But for large panels it's bad.

# Let's fix the specific ones we know are broken first.

# 1. Smart Budget Templates overlay
# Let's use regex to find where it is.
# Actually I'll just write a script to replace all of them with 'var(--card-bg)' or similar? No, just use `isDark ? 255 : 0` ... wait!
# If they wanted it to be black in dark mode and white in light mode, it should be `isDark ? 0 : 255` !!
# But wait, in dark mode they want white text/borders (255).
# If it's a background, in dark mode they want white-transparent (255, 0.1). In light mode they want black-transparent (0, 0.1).
# BUT for solid panels, in dark mode they want black (0, 0.9). In light mode they want white (255, 0.9).
# So the logic is inverted for solid panels!

def replacer(match):
    prefix = match.group(1)
    opacity = float(match.group(2))
    
    # If opacity is high (> 0.4), it's probably a solid panel. It should be white in light mode (255), and dark in dark mode (0 or 255 depending on the other side of the ternary).
    # Since we are replacing the light-mode side of the ternary (e.g. `isDark ? '...' : \`rgba(...)\``),
    # the light mode value should just be 'rgba(255,255,255, X)' for high opacity panels (white),
    # and 'rgba(0,0,0, X)' for low opacity (subtle black shadows/borders).
    
    if opacity >= 0.4:
        return f"{prefix}'rgba(255,255,255,{opacity})'"
    else:
        # For low opacity, black is fine in light mode.
        return f"{prefix}'rgba(0,0,0,{opacity})'"

# The pattern is something like: : `rgba(${isDark ? 255 : 0},${isDark ? 255 : 0},${isDark ? 255 : 0},0.95)`
content = re.sub(r"(: |:)\`rgba\(\$\{isDark \? 255 : 0\},\$\{isDark \? 255 : 0\},\$\{isDark \? 255 : 0\},([0-9.]+)\)\`", replacer, content)

with open('src/components/LandingPage.tsx', 'w') as f:
    f.write(content)
print("Fixed!")
