const mongoose = require("mongoose");
const Document = require("./Document");

const io = require("socket.io")(3001, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const defaultValue = "";
mongoose.connect("mongodb://localhost/google-docs-clone");

io.on("connection", (socket) => {
  console.log("Connection established", socket.id);
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

io.on("disconnect", () => {
  console.log("Disconnection");
});

const findOrCreateDocument = async (id) => {
  if (id === null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultValue });
};
