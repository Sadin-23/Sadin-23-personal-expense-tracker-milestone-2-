// middleware/secureMiddleware.ts
import { Request, Response, NextFunction } from "express";

// Deze middleware controleert of de gebruiker ingelogd is
export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.session.user) {
        // Als de gebruiker niet ingelogd is, stuur ze door naar de loginpagina
        return res.redirect("/login");
    }
    next();  // Als de gebruiker ingelogd is, ga verder naar de volgende route
}
