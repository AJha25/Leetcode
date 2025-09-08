const express = require('express')
const app = express();
require('dotenv').config();
const main =  require('./config/db')
const cookieParser =  require('cookie-parser');
const authRouter = require("./routes/userAuth");
const redisClient = require('./config/redis');
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit")
const aiRouter = require("./routes/aiChatting")
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')

// console.log("Hello")

const allowedOrigins = [
  "http://localhost:5173",                 // local dev
  process.env.FRONTEND_URL                 // your deployed frontend from env
];

// CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed for this origin"));
    }
  },
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/video",videoRouter);

module.exports = app;

// ✅ Local development only
if (require.main === module) {
  const InitalizeConnection = async () => {
    try {
      await Promise.all([main(), redisClient.connect()]);
      console.log("DB Connected");

      app.listen(process.env.PORT || 3000, () => {
        console.log(
          "Server listening at port number: " + (process.env.PORT || 3000)
        );
      });
    } catch (err) {
      console.log("Error: " + err);
    }
  };

  InitalizeConnection();
}
