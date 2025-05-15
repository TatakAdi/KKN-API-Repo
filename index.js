// Buat testing di lokal server

const app = require("./server");

app.listen(8080, () => {
  console.log("Server started on port http://localhost:8080");
});
