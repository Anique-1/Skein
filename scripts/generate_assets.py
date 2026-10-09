import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Brand palette
INK = (21, 17, 31)          # #15111F
WOOL = (35, 27, 51)         # #231B33
FIBER = (58, 46, 82)        # #3A2E52
THREAD = (242, 167, 195)    # #F2A7C3
KNOT = (246, 209, 134)      # #F6D186
MIST = (185, 175, 208)      # #B9AFD0
PAPER = (245, 239, 250)     # #F5EFFA

SCALE = 4
SIZE = 1024 * SCALE
CX = SIZE // 2
CY = SIZE // 2

def create_emblem(draw, center_x, center_y, radius, transparent=False):
    # Rings
    rings = [0.35, 0.65, 0.95]
    for r_ratio in rings:
        r = radius * r_ratio
        bbox = [center_x - r, center_y - r, center_x + r, center_y + r]
        draw.ellipse(bbox, outline=(*FIBER, 200) if transparent else FIBER, width=int(6 * SCALE))

    # Node positions (tri-fold symmetric network)
    angles_deg = [30, 90, 150, 210, 270, 330]
    nodes = []
    
    # 6 outer/middle nodes with varying radii to form a skein knot weave
    node_radii = [0.65, 0.95, 0.65, 0.95, 0.65, 0.95]
    for i, (deg, r_mult) in enumerate(zip(angles_deg, node_radii)):
        rad = math.radians(deg - 15)
        dist = radius * r_mult
        nx = center_x + dist * math.cos(rad)
        ny = center_y + dist * math.sin(rad)
        nodes.append((nx, ny))

    # Connect central knot to alternate nodes
    for i in [0, 2, 4]:
        nx, ny = nodes[i]
        draw.line([(center_x, center_y), (nx, ny)], fill=THREAD if not transparent else (*THREAD, 230), width=int(10 * SCALE))

    # Connect adjacent nodes to weave the mesh perimeter
    for i in range(len(nodes)):
        next_i = (i + 1) % len(nodes)
        draw.line([nodes[i], nodes[next_i]], fill=THREAD if not transparent else (*THREAD, 230), width=int(10 * SCALE))

    # Draw outer node points
    node_point_r = int(24 * SCALE)
    for (nx, ny) in nodes:
        draw.ellipse(
            [nx - node_point_r, ny - node_point_r, nx + node_point_r, ny + node_point_r],
            fill=THREAD if not transparent else (*THREAD, 255)
        )
        # Inner white dot for premium depth
        inner_r = int(8 * SCALE)
        draw.ellipse(
            [nx - inner_r, ny - inner_r, nx + inner_r, ny + inner_r],
            fill=PAPER if not transparent else (*PAPER, 255)
        )

    # Central glowing gold knot
    knot_r = int(48 * SCALE)
    draw.ellipse(
        [center_x - knot_r, center_y - knot_r, center_x + knot_r, center_y + knot_r],
        fill=KNOT if not transparent else (*KNOT, 255)
    )
    # Knot inner core
    core_r = int(18 * SCALE)
    draw.ellipse(
        [center_x - core_r, center_y - core_r, center_x + core_r, center_y + core_r],
        fill=PAPER if not transparent else (*PAPER, 255)
    )

def generate_master_icon():
    img = Image.new("RGBA", (SIZE, SIZE), (*INK, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    
    # Soft background circular glow behind the emblem
    glow_r = int(SIZE * 0.42)
    glow_img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img, "RGBA")
    glow_draw.ellipse(
        [CX - glow_r, CY - glow_r, CX + glow_r, CY + glow_r],
        fill=(*WOOL, 160)
    )
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(radius=60 * SCALE))
    img.alpha_composite(glow_img)
    
    draw = ImageDraw.Draw(img, "RGBA")
    create_emblem(draw, CX, CY, radius=int(SIZE * 0.38), transparent=False)
    
    # Resize down with high quality Lanczos antialiasing
    final = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    final.save("assets/icon.png", "PNG", optimize=True)
    print("Saved assets/icon.png")

def generate_adaptive_icon():
    # Adaptive foreground must have transparent background and fit within 66% safe zone (e.g. ~440px radius on 1024)
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    
    create_emblem(draw, CX, CY, radius=int(SIZE * 0.26), transparent=True)
    
    final = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    final.save("assets/adaptive-icon.png", "PNG", optimize=True)
    print("Saved assets/adaptive-icon.png")

def generate_splash_icon():
    img = Image.new("RGBA", (SIZE, SIZE), (*INK, 255))
    draw = ImageDraw.Draw(img, "RGBA")
    
    create_emblem(draw, CX, CY, radius=int(SIZE * 0.28), transparent=False)
    
    final = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    final.save("assets/splash.png", "PNG", optimize=True)
    print("Saved assets/splash.png")

def generate_favicon():
    img = Image.open("assets/icon.png")
    fav = img.resize((48, 48), Image.Resampling.LANCZOS)
    fav.save("assets/favicon.png", "PNG")
    print("Saved assets/favicon.png")

if __name__ == "__main__":
    generate_master_icon()
    generate_adaptive_icon()
    generate_splash_icon()
    generate_favicon()
