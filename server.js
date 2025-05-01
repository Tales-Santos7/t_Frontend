// Backend completo com upload para imgbb
const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const app = express();
const port = 3000;
require("dotenv").config();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Conectado ao MongoDB"))
  .catch((err) => console.error("Erro ao conectar ao MongoDB:", err));

const upload = multer({ dest: "temp/" });

// Esquema Content
const contentSchema = new mongoose.Schema({
  section: { type: String, required: true },
  color: String,
  images: [String],
  title: String,
  description: String,
});
const Content = mongoose.model("Content", contentSchema);

// GALERIA
app.delete("/content/gallery", async (req, res) => {
  try {
    const { imageUrl } = req.query;
    if (!imageUrl) return res.status(400).json({ message: "URL da imagem não fornecida" });

    const gallery = await Content.findOne({ section: "gallery" });
    if (!gallery) return res.status(404).json({ message: "Galeria não encontrada" });

    gallery.images = gallery.images.filter((image) => image !== imageUrl);
    await gallery.save();

    res.json({ images: gallery.images });
  } catch (error) {
    console.error("Erro ao remover imagem:", error);
    res.status(500).json({ message: "Erro ao remover imagem" });
  }
});

//ATUALIZAR GALERIA
app.put("/content/gallery/update", upload.single("image"), async (req, res) => {
  try {
    const { oldImageUrl } = req.body;
    if (!oldImageUrl || !req.file) {
      return res.status(400).json({ message: "Dados insuficientes para atualizar a imagem." });
    }

    const gallery = await Content.findOne({ section: "gallery" });
    if (!gallery) return res.status(404).json({ message: "Galeria não encontrada" });

    const index = gallery.images.indexOf(oldImageUrl);
    if (index === -1) return res.status(404).json({ message: "Imagem não encontrada na galeria" });

    const formData = new FormData();
    formData.append("image", fs.createReadStream(req.file.path));

    const response = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.POSTIMAGES_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );

    const newImageUrl = response.data.data.url;
    fs.unlinkSync(req.file.path); // Remove o ficheiro temporário

    gallery.images[index] = newImageUrl;
    await gallery.save();

    res.json({ images: gallery.images });
  } catch (error) {
    console.error("Erro ao atualizar imagem:", error);
    res.status(500).json({ message: "Erro ao atualizar imagem" });
  }
});

app.put("/content/gallery", upload.array("images", 10), async (req, res) => {
  try {
    let gallery = await Content.findOne({ section: "gallery" });
    if (!gallery) {
      gallery = new Content({ section: "gallery", images: [] });
    }

    const uploadedUrls = [];

    for (const file of req.files) {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(file.path));

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.POSTIMAGES_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      const imageUrl = response.data.data.url;
      uploadedUrls.push(imageUrl);

      fs.unlinkSync(file.path); // apagar ficheiro local
    }

    gallery.images.push(...uploadedUrls);
    await gallery.save();

    res.json({ images: gallery.images });
  } catch (error) {
    console.error("Erro ao adicionar imagens à galeria:", error);
    res.status(500).json({ message: "Erro ao adicionar imagens à galeria" });
  }
});

// Atualizar a cor
app.put("/content/theme", async (req, res) => {
  const { color } = req.body;
  try {
    const updated = await Content.findOneAndUpdate(
      { section: "theme" },
      { color },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar o tema" });
  }
});

app.get("/content/theme", async (req, res) => {
  try {
    const theme = await Content.findOne({ section: "theme" });
    if (!theme) {
      return res.status(404).json({ message: "Tema não encontrado" });
    }
    res.json(theme);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter o tema" });
  }
});

app.put("/content/:section", async (req, res) => {
  const { section } = req.params;
  const { title, description } = req.body;

  try {
    const updatedContent = await Content.findOneAndUpdate(
      { section },
      { title, description },
      { new: true, upsert: true }
    );
    res.json(updatedContent);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar conteúdo da seção" });
  }
});

app.get("/content/:section", async (req, res) => {
  const { section } = req.params;
  try {
    const content = await Content.findOne({ section });
    if (!content) {
      return res.status(404).json({ message: "Seção não encontrada" });
    }
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter conteúdo da seção" });
  }
});

// BLOG
const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
});
const Post = mongoose.model("Post", postSchema);

app.get("/blog", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Erro ao carregar posts" });
  }
});

app.post("/blog", upload.single("image"), async (req, res) => {
  try {
    let imageUrl = "";
    if (req.file) {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(req.file.path));

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.POSTIMAGES_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );

      imageUrl = response.data.data.url;
      fs.unlinkSync(req.file.path);
    }

    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      imageUrl,
    });
    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error("Erro ao criar post:", error);
    res.status(500).json({ message: "Erro ao criar post" });
  }
});

app.put("/blog/:id", upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado" });

    let imageUrl = post.imageUrl;
    if (req.file) {
      const formData = new FormData();
      formData.append("image", fs.createReadStream(req.file.path));

      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${process.env.POSTIMAGES_API_KEY}`,
        formData,
        { headers: formData.getHeaders() }
      );
      imageUrl = response.data.data.url;
      fs.unlinkSync(req.file.path);
    }

    post.title = req.body.title;
    post.content = req.body.content;
    post.imageUrl = imageUrl;
    await post.save();
    res.json(post);
  } catch (error) {
    console.error("Erro ao atualizar post:", error);
    res.status(500).json({ message: "Erro ao atualizar post" });
  }
});

app.delete("/blog/:id", async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: "Post não encontrado" });
    res.json({ message: "Post excluído com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao excluir post" });
  }
});

// Redes Sociais
const socialSchema = new mongoose.Schema({
  name: String,
  url: String,
});
const SocialLink = mongoose.model("SocialLink", socialSchema);

app.get("/social-links", async (req, res) => {
  try {
    const links = await SocialLink.find();
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: "Erro ao obter links das redes sociais" });
  }
});

app.put("/social-links/:id", async (req, res) => {
  try {
    const { url } = req.body;
    const link = await SocialLink.findByIdAndUpdate(req.params.id, { url }, { new: true });
    res.json(link);
  } catch (error) {
    res.status(500).json({ message: "Erro ao atualizar link da rede social" });
  }
});

app.post("/social-links", async (req, res) => {
  try {
    const { name, url } = req.body;
    const newLink = new SocialLink({ name, url });
    await newLink.save();
    res.status(201).json(newLink);
  } catch (error) {
    res.status(500).json({ message: "Erro ao adicionar link de rede social" });
  }
});

// Serve arquivos estáticos como CSS, imagens e JS
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rota para a página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(
    `Servidor backend rodando em https://tatyana-vanin.onrender.com/`
  );
});
