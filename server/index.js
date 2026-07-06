const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(
  cors({
    origin: [
<<<<<<< HEAD
      "http://localhost:3000",
      "https://style-hub-rouge.vercel.app",
=======
      "http://localhost:3000",          // local development
      "https://style-hub-rouge.vercel.app/",    // replace with your Vercel URL
>>>>>>> da4049d (Update API URL and CORS configuration)
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/users", require("./routes/users"));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
<<<<<<< HEAD
);
=======
);
>>>>>>> da4049d (Update API URL and CORS configuration)
