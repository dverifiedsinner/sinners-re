import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const DB_FILE = "db.json";
const JWT_SECRET = process.env.JWT_SECRET || "aura-secret-key-2024";

// Initial DB state
const initialDb = {
  users: [],
  products: [
    {
      id: 'aura-one',
      name: 'Aura One',
      tagline: 'Quiet focus, captured.',
      description: 'A minimalist E-Ink tablet designed for deliberate writing and distraction-free reading.',
      price: 499,
      originalPrice: 599,
      image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=1000',
      features: ['10.3" Paperwhite Display', 'Pressure-sensitive Stylus', 'No Blue Light'],
      status: 'Preorder',
      inventory: 50,
      category: 'Electronics'
    },
    {
      id: 'lumina-phone',
      name: 'Lumina Phone',
      tagline: 'Reclaim your time.',
      description: 'A revolutionary device with a monochrome display and a dedicated physical switch for "Deep Work" mode.',
      price: 799,
      originalPrice: 899,
      image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1000',
      features: ['Monochrome E-Ink Screen', 'Mechanical Focus Switch'],
      status: 'Preorder',
      inventory: 30,
      category: 'Electronics'
    },
    {
      id: 'stride-essence',
      name: 'Stride Essence',
      tagline: 'Movement simplified.',
      description: 'Hand-crafted minimal sneakers with recycled ocean plastic soles and organic cotton upper.',
      price: 180,
      originalPrice: 240,
      image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=1000',
      features: ['Recycled Soles', 'Breathable Upper', 'Ultra Light'],
      status: 'Preorder',
      inventory: 100,
      category: 'Shoes'
    },
    {
      id: 'zenith-tunic',
      name: 'Zenith Tunic',
      tagline: 'The weight of light.',
      description: 'A seamless linen garment designed for maximum airflow and timeless silhouette.',
      price: 120,
      originalPrice: 160,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=1000',
      features: ['100% Organic Linen', 'Hidden Pockets', 'Anti-wrinkle'],
      status: 'Preorder',
      inventory: 150,
      category: 'Clothes'
    },
    {
      id: 'mono-ring',
      name: 'Mono Ring',
      tagline: 'Infinite flow.',
      description: 'A single band of matte-finished Grade-5 Titanium. Symbolizing strength in singularity.',
      price: 250,
      originalPrice: 300,
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3f876?auto=format&fit=crop&q=80&w=1000',
      features: ['Grade-5 Titanium', 'Surgical Grade', 'Matte Finish'],
      status: 'Preorder',
      inventory: 80,
      category: 'Jewelry'
    },
    {
      id: 'apex-watch',
      name: 'Apex Watch',
      tagline: 'Time, essential.',
      description: 'Mechanical timepiece with no branding. Swiss movement, sapphire glass, brushed steel.',
      price: 1200,
      originalPrice: 1500,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000',
      features: ['Swiss Automatic', 'Sapphire Glass', 'Titanium Case'],
      status: 'Preorder',
      inventory: 20,
      category: 'Jewelry'
    },
    {
      id: 'urban-kimono',
      name: 'Urban Kimono',
      tagline: 'Structure & Ease.',
      description: 'Heavyweight jersey knit kimono. A modern take on the traditional silhouette for city living.',
      price: 280,
      originalPrice: 350,
      image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1000',
      features: ['Heavyweight Cotton', 'Magnetic Closure', 'Oversized Fit'],
      status: 'Preorder',
      inventory: 60,
      category: 'Clothes'
    },
    {
      id: 'aura-glass',
      name: 'Aura Spec 01',
      tagline: 'Clarity redefined.',
      description: 'Blue-light filtering eyewear with titanium frames and Zeiss optics.',
      price: 220,
      originalPrice: 280,
      image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=1000',
      features: ['Zeiss Optics', 'Titanium Frames', 'Blue Light Filter'],
      status: 'Preorder',
      inventory: 90,
      category: 'Accessories'
    },
    {
      id: 'terra-pouch',
      name: 'Terra Pouch',
      tagline: 'Organic protection.',
      description: 'Vegetable-tanned leather sleeve for your Aura One or Lumina Phone.',
      price: 85,
      originalPrice: 110,
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1000',
      features: ['Vegetable Tanned', 'Hand-stitched', 'Aging Patina'],
      status: 'Preorder',
      inventory: 200,
      category: 'Accessories'
    },
    {
      id: 'minimal-hoodie',
      name: 'Core Hoodie',
      tagline: 'Comfort, distilled.',
      description: 'Zero-logo, high-density French Terry hoodie. Structured fit, deep hood.',
      price: 150,
      originalPrice: 190,
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000',
      features: ['French Terry', 'Reinforced Cuffs', 'Minimal Seams'],
      status: 'Preorder',
      inventory: 120,
      category: 'Clothes'
    },
    {
      id: 'obsidian-bracelet',
      name: 'Obsidian Arc',
      tagline: 'Natural resolve.',
      description: 'Raw obsidian stone beads with a titanium clasp. Grounding weight.',
      price: 140,
      originalPrice: 180,
      image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=1000',
      features: ['Natural Obsidian', 'Titanium Clasp', 'Hand-strung'],
      status: 'Preorder',
      inventory: 50,
      category: 'Jewelry'
    },
    {
      id: 'luna-sneaker',
      name: 'Luna Trainer',
      tagline: 'Weightless stride.',
      description: 'Technical running shoe with a 3D-knitted collar and carbon-fiber propulsive plate.',
      price: 210,
      originalPrice: 260,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000',
      features: ['Carbon Plate', '3D Knit', 'High Energy Return'],
      status: 'Preorder',
      inventory: 40,
      category: 'Shoes'
    },
    {
      id: 'linear-bag',
      name: 'Linear Pack',
      tagline: 'Carry, perfected.',
      description: 'Waterproof nylon backpack with magnetic Fidlock closures and internal laptop vault.',
      price: 320,
      originalPrice: 400,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=1000',
      features: ['Waterproof Nylon', 'Fidlock Buckles', 'Internal Vault'],
      status: 'Preorder',
      inventory: 35,
      category: 'Accessories'
    },
    {
      id: 'silk-overshirt',
      name: 'Flux Shirt',
      tagline: 'Fluid geometry.',
      description: 'Silk-blend oversized shirt with hidden buttons and raw-edge hem.',
      price: 195,
      originalPrice: 245,
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=1000',
      features: ['Silk Blend', 'Raw Edge', 'Oversized Fit'],
      status: 'Preorder',
      inventory: 75,
      category: 'Clothes'
    }
  ],
  orders: [],
};

// Load or Save DB
function getDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDb(db: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini AI Setup
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "dummy-key",
  });

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Get current user profile
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    try {
      const db = getDb();
      const user = db.users.find((u: any) => u.id === req.user.id);
      if (!user) {
        return res.status(401).json({ error: "Session invalid" });
      }
      res.json({ user: { id: user.id, email: user.email, name: user.name, walletBalance: user.walletBalance, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Profile fetch failed" });
    }
  });

  // User Auth
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      const db = getDb();
      if (db.users.find((u: any) => u.email === email)) {
        return res.status(400).json({ error: "This email is already associated with an Aura ID." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = { 
        id: Date.now().toString(), 
        email, 
        password: hashedPassword, 
        name, 
        walletBalance: 0,
        role: email === "denacchy@gmail.com" ? "admin" : "user"
      };
      db.users.push(newUser);
      saveDb(db);
      
      const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET);
      res.status(201).json({ 
        token, 
        user: { id: newUser.id, email: newUser.email, name: newUser.name, walletBalance: newUser.walletBalance, role: newUser.role }
      });
    } catch (error) {
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const db = getDb();
      const user = db.users.find((u: any) => u.email === email);
      
      if (!user) {
        return res.status(401).json({ error: "Aura ID not found. Please register first." });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials." });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, walletBalance: user.walletBalance, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: "Login failed." });
    }
  });

  // Wallet
  app.post("/api/wallet/fund", authenticateToken, (req: any, res) => {
    const { amount } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.id === req.user.id);
    if (user) {
      user.walletBalance += amount;
      saveDb(db);
      res.json({ balance: user.walletBalance });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  });

  // Products
  app.get("/api/products", (req, res) => {
    const db = getDb();
    res.json(db.products);
  });

  app.post("/api/products", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const db = getDb();
    const newProduct = { ...req.body, id: Date.now().toString() };
    db.products.push(newProduct);
    saveDb(db);
    res.status(201).json(newProduct);
  });

  // Orders
  app.post("/api/orders", authenticateToken, (req: any, res) => {
    const { productId, address } = req.body;
    const db = getDb();
    const user = db.users.find((u: any) => u.id === req.user.id);
    const product = db.products.find((p: any) => p.id === productId);

    if (!user || !product) return res.status(404).json({ error: "User or product not found" });
    if (user.walletBalance < product.price) return res.status(400).json({ error: "Insufficient wallet balance" });

    user.walletBalance -= product.price;
    const newOrder = {
      id: `ORD-${Date.now()}`,
      userId: user.id,
      productId,
      productName: product.name,
      price: product.price,
      address,
      status: "Preordered",
      tracking: "Pending",
      createdAt: new Date().toISOString()
    };
    db.orders.push(newOrder);
    saveDb(db);
    res.status(201).json(newOrder);
  });

  app.get("/api/orders", authenticateToken, (req: any, res) => {
    const db = getDb();
    const userOrders = db.orders.filter((o: any) => o.userId === req.user.id);
    res.json(userOrders);
  });

  // Admin Dashboard Data
  app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== "admin") return res.sendStatus(403);
    const db = getDb();
    res.json({
      totalUsers: db.users.length,
      totalOrders: db.orders.length,
      totalRevenue: db.orders.reduce((acc: number, o: any) => acc + o.price, 0),
      products: db.products
    });
  });

  // Gemini Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, productContext } = req.body;
      const prompt = `You are a luxury concierge for "Aura", a high-end preorder platform. 
      The user is asking about: "${message}". 
      Current product context: ${JSON.stringify(productContext)}.
      Stay sophisticated and exclusive. Concise responses.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });
      res.json({ text: response.text });
    } catch (error) {
      res.status(500).json({ error: "AI Failed" });
    }
  });

  // Vite setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

