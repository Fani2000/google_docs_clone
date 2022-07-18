import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import "quill/dist/quill.snow.css";
import "../styles.css";

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ align: [] }],
  ["image", "blockqoute", "code-block"],
  ["clean"],
];

const TextEditor = () => {
  const { id: documentId } = useParams();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  useEffect(() => {
    const s = io("http://localhost:3001");
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket == null || quill == null) return;
    const handler = (delta) => {
      quill.updateContents(delta);
    };
    socket.on("receive-changes", handler);

    return () => {
      socket.on("receive-changes", handler);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (socket == null || quill == null) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);

    return () => {
      quill.off("text-change", handler);
    };
  }, [quill, socket]);

  useEffect(() => {
    if (socket === null || quill === null) return;

    socket.once("load-document", (document) => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", documentId);
  }, [quill, socket, documentId]);

  useEffect(() => {
    if (socket === null || quill === null) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, 3000);
    return () => {
      clearInterval(interval);
    };
  }, [socket, quill]);

  const wrapperRef = useCallback((wrapper) => {
    if (wrapper === null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);
    const q = new Quill(".container", {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    });
    q.disable();
    q.setText("Loading....");
    setQuill(q);
  }, []);
  return <div className="container" ref={wrapperRef}></div>;
};

export default TextEditor;
