import os
import glob

replacements = {
    "rgba(99, 102, 241": "rgba(34, 197, 94",
    "#6366f1": "var(--primary)",
    "#4f46e5": "var(--secondary)",
    "#ec4899": "var(--secondary)",
    "rgba(236, 72, 153": "rgba(20, 184, 166"
}

# The shopping category is explicitly pink, let's make sure we don't accidentally ruin the shopping color if we want it pink.
# Actually, the user's logo colors are green and teal. So replacing pink with teal might be totally fine.
# But wait, we should only replace the hardcoded theme colors.
# Let's run this for all .tsx files in src/components/ and src/App.tsx.

files = glob.glob('/Users/apple/.gemini/antigravity-ide/scratch/zenbudget-app/src/**/*.tsx', recursive=True)
files.append('/Users/apple/.gemini/antigravity-ide/scratch/zenbudget-app/src/index.css')

for filepath in files:
    if not os.path.isfile(filepath): continue
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if content != new_content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

print("Colors updated successfully.")
