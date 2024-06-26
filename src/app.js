import { Server } from "socket.io";
import express from "express";
import { productRouter } from "./routes/productRouter.js";
import { cartRouter } from "./routes/cartRouter.js";
import userRouter from "./routes/userRouter.js";
import { connectMongoDB } from "./config/dbConfig.js";
import productService from "./dao/services/productService.js";
import { middlewareConfig } from "./config/middlewareConfig.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { addLogger } from "./utils/loggers-env.js";

const app = express();
const port = process.env.PORT || 8080;
const server = app.listen(port, () => console.log("Servidor operando en puerto", port));

connectMongoDB();

// Configuración de Winston
app.use(addLogger)

// Configuración de middlewares
middlewareConfig(app);

// Rutas
app.use("/api/products", productRouter);
app.use("/api/carts", cartRouter);
app.use("/api/users", userRouter);

// Ruta de prueba de logger
app.get("/loggertest", (req, res) => {
  try {
    req.logger.fatal("Este es un mensaje fatal");
    req.logger.error("Este es un mensaje de error");
    req.logger.warn("Este es un mensaje de advertencia");
    req.logger.info("Este es un mensaje de información");
    req.logger.debug("Este es un mensaje de depuración");

    res.status(200).send("Logs probados correctamente");
  } catch (error) {
    req.logger.error("Error al probar los logs:", error);
    res.status(500).send("Error al probar los logs");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/chat", (req, res) => {
  res.render("chat");
});

app.get("/product", (req, res) => {
  res.render("product");
});

// Middleware de manejo de errores
app.use(errorHandler);

// Configuración de socket.io
const io = new Server(server);
const messages = []; 

io.on("connection", (socket) => {

  console.log("Nuevo usuario conectado:", socket.id);
  socket.emit("messageLogs", messages);
  socket.on("message", (data) => {
    try {
      messages.push(data); 
      io.emit("messageLogs", messages); 
    } catch (error) {
      console.error("Error al guardar el mensaje:", error);
    }
  });

  socket.on("producto", async () => {
    try {
      const allProduct = await productService.getProducts();
      console.log(allProduct);
      io.emit("producto", allProduct);
    } catch (error) {
      console.error("Error al mostrar productos:", error);
    }
  });
});
