import sys

with open("toolkit_section.tsx", "r") as f:
    toolkit_content = f.read()

with open("src/components/LandingPage.tsx", "r") as f:
    content = f.read()

# 1. Remove desktop navbar link
content = content.replace("              { label: 'Toolkit', id: 'toolkit', key: 'toolkit', hasDropdown: false },\n", "")

# 2. Remove desktop navbar click handler
content = content.replace("                    } else if (link.key === 'toolkit') {\n                      navigateToPage('toolkit');\n", "")

# 3. Remove mobile menu link
content = content.replace("            <button onClick={() => { setMobileMenuOpen(false); navigateToPage('toolkit'); }} style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: t.text, fontSize: '15px', fontWeight: 700 }}>Toolkit</button>\n", "")

# 4. Insert toolkit section before features section
insertion_point = "      <section id=\"features\" style={{ padding: '40px 24px 80px', maxWidth: '1440px', margin: '0 auto', overflow: 'hidden' }}>"
if insertion_point in content:
    content = content.replace(insertion_point, toolkit_content + "\n" + insertion_point)
    print("Successfully modified LandingPage.tsx")
else:
    print("Could not find insertion point!")

with open("src/components/LandingPage.tsx", "w") as f:
    f.write(content)
