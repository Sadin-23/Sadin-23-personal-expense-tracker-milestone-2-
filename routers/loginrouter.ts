import express from "express";
import {User} from "../types"
import {login, userCollection} from "../database";
import { secureMiddleware } from "../Middleware/secureMiddleware";
import bcrypt from "bcrypt";


export function loginRouter() {
    const router = express.Router();

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
            res.redirect("/expenses");  // Redirect naar de expense tracker
        } else {
            req.session.message = { type: "error", message: "Invalid username or password" };
            res.redirect("/login");
        }
    });

    router.post("/logout", secureMiddleware, async (req, res) => {
        req.session.destroy((err) => {
            res.redirect("/login");
        });
    });

    return router;
}