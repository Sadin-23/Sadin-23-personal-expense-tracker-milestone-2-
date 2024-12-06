import express from 'express';
import path from 'path';
import { createRouter } from './routers/route';

const app = express();

app.set('view engine', 'ejs');
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended:true}))
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const router = createRouter(); 
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
