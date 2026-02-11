import app from "./app";
import connectDB from "./database/db";

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
