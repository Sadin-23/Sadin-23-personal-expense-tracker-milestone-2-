import express from "express";
import {User} from "../types"
import {login, userCollection} from "../database";
import { secureMiddleware } from "../Middleware/secureMiddleware";
import bcrypt from "bcrypt";


export function loginRouter() {
    const router = express.Router();

    // Render de loginpagina als de gebruiker niet ingelogd is
    router.get('/', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');  // Als de gebruiker niet is ingelogd, redirect naar loginpagina
    }
    res.redirect('/index');  // Als de gebruiker ingelogd is, ga naar de expenses pagina
  });

    router.get("/login", async (req, res) => {
        if (req.session.user) {
            return res.redirect("/expenses"); 
        }
        res.render("login");
    });

    router.post("/login", async (req, res) => {
        const username: string = req.body.username;
        const password: string = req.body.password;

        if (!username || !password) {
            req.session.message = { type: "error", message: "Username and password are required" };
            return res.redirect("/login");
        }

        
        const user: User | null = await userCollection.findOne({ username });
        if (user && user.password && await bcrypt.compare(password, user.password)) {
            // Verwijder het wachtwoord uit de sessiegegevens
            delete user.password;
            req.session.user = user;
            req.session.message = { type: "success", message: "Login successful" };
            res.redirect("/index");  // Redirect naar de expense tracker
        } else {
            req.session.message = { type: "error", message: "Invalid username or password" };
            res.redirect("/login");
        }
    });

    

    router.post("/logout", async (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Fout bij het vernietigen van de sessie", err);
                return res.status(500).send("Er is een fout opgetreden tijdens het uitloggen");
            }

            // Redirect naar de inlogpagina of een andere gewenste pagina
            res.redirect("/login");
        });
    });

    return router;
}