from PIL import Image

# Load the uploaded image
img_path = "/Users/apple/.gemini/antigravity-ide/brain/7f519da6-ec41-4bb2-bcc9-95496144edcf/media__1783929429600.jpg"
img = Image.open(img_path)
width, height = img.size
print(f"Dimensions: {width}x{height}")

# Let's inspect the layout of the image.
# It is a standard horizontal layout:
# Top: Main logo horizontal version
# Middle: Components breakdown
# Bottom: Dark/Light icons and logotype versions
# The dark icon is in the bottom left area.
# Let's calculate the bounding box for the dark icon.
# On a standard 1000x800 image:
# Bottom row is roughly between y = 500 to 700.
# Let's write a crop script that extracts a square around the bottom-left icon.
# To be safe, we can output multiple crops or crop the main green icon at the top!
# Wait, look at the top left icon: it is a transparent/white background version.
# Let's do a crop of the dark icon in the bottom-left quadrant.
# Bounding box is roughly: left=50, top=500, right=200, bottom=650.
# Let's run a script that saves a few test crops so we can inspect them or pick the best!

# Let's crop the bottom-left dark square icon:
# Dimensions of the image are 1000x800 (from similar assets). Let's calculate relative coordinates:
# Left: 5% to 25% of width
# Top: 60% to 85% of height
left = int(width * 0.04)
top = int(height * 0.62)
right = int(width * 0.19)
bottom = int(height * 0.86)

# Make sure it's a square
box_width = right - left
box_height = bottom - top
size = min(box_width, box_height)
right = left + size
bottom = top + size

cropped = img.crop((left, top, right, bottom))
cropped.save("/Users/apple/.gemini/antigravity-ide/scratch/zenbudget-app/assets/icon.png")
print("Cropped successfully!")
