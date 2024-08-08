import express from 'express';
import apiRoutes from './routes'

const app = express();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON request bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!, surprise, surprise it works');
});

app.use('/api', apiRoutes);



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


export  {app}