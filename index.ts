import express from 'express';
import path from 'path';
import { createRouter } from './routers/route';
import { loginRouter } from './routers/loginrouter';
import { secureMiddleware,  } from './Middleware/secureMiddleware';
import session from "./session";
import { flashMiddleware } from './Middleware/flashMiddleware';
import { connect } from './database';
import { registrationRouter } from './routers/registratie';



const app = express();

app.set('view engine', 'ejs');
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended:true}))
app.use(session);
app.use(flashMiddleware)
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));



app.set("port", process.env.PORT || 3000);
app.use('/', loginRouter());
const router = createRouter(); 
app.use('/', router);
app.use('/', registrationRouter());

app.use("/", secureMiddleware, );


app.listen(app.get("port"), async() => {
  try {
      await connect();
      console.log("Server started on http://localhost:" + app.get('port'));
  } catch (error) {
      console.error(error);
      process.exit(1);
  }
});
