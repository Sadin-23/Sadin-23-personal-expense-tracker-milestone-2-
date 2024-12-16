import express from "express";
import {User} from "../types"
import {login} from "../database";
import { secureMiddleware } from "../Middleware/secureMiddleware";

export function loginRouter() {
    const router = express.Router();

    router.get("/login", async (req, res) => {
        res.render("login");
    });

    router.post("/login", async (req, res) => {
        const username: string = req.body.email;
        const password: string = req.body.password;
        try {
            let user: User = await login(username, password);
            delete user.password; // Remove password from user object. Sounds like a good idea.
            req.session.user = user;
            req.session.message = {type: "success", message: "Login successful"};
            res.redirect("/")
        } catch (e: any) {
            req.session.message = {type: "error", message: e.message};
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