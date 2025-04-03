import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Add user to Express namespace for TypeScript
declare global {
  namespace Express {
    // Define User interface with properties we need
    interface User {
      id: number;
      username: string;
      email: string;
      fullName: string;
      role: string;
      isActive: boolean;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Initialize PostgreSQL session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({
  pool,
  tableName: 'sessions',
  createTableIfMissing: true
});

/**
 * Hash password using scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compare supplied password with stored password
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Setup authentication middleware and routes
 */
export function setupAuth(app: Express) {
  // Configure session
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "payroll-pro-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Configure serialization/deserialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || undefined);
    } catch (error) {
      done(error);
    }
  });

  // Register routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      // Check if username exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create user
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        role: req.body.role || "user" // Default role
      });

      // Log activity
      await storage.createActivity({
        userId: user.id,
        action: "register",
        entityType: "user",
        entityId: user.id,
        details: `User ${user.username} registered`,
        ipAddress: req.ip || "127.0.0.1"
      });

      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: Error, user: User) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Log activity
        try {
          await storage.createActivity({
            userId: user.id,
            action: "login",
            entityType: "user",
            entityId: user.id,
            details: `User ${user.username} logged in`,
            ipAddress: req.ip || "127.0.0.1"
          });
        } catch (error) {
          console.error("Error logging activity:", error);
        }
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    const userId = req.user?.id;
    const username = req.user?.username;
    
    req.logout((err) => {
      if (err) return next(err);
      
      // Log activity if user was logged in
      if (userId && username) {
        storage.createActivity({
          userId,
          action: "logout",
          entityType: "user",
          entityId: userId,
          details: `User ${username} logged out`,
          ipAddress: req.ip || "127.0.0.1"
        }).catch(error => {
          console.error("Error logging activity:", error);
        });
      }
      
      res.sendStatus(200);
    });
  });

  app.get("/api/users/current", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user without password
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
}