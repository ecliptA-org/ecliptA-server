const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('서버 작동 중');
});

app.listen(PORT, () => {
  console.log(`포트: ${PORT}`);
});
