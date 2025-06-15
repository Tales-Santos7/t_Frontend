// COR DO TEMA
fetch("https://tatyana-vanin.onrender.com/content/theme")
  .then((res) => res.json())
  .then((data) => {
    if (data.color) {
      document.documentElement.style.setProperty("--primary-color", data.color);
    }
  });

// SEÇÃO PRINCIPAL
fetch("https://tatyana-vanin.onrender.com/content/mainSection")
  .then((response) => {
    if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
    return response.json();
  })
  .then((data) => {
    document.querySelector("h1").innerText = data.title;
    document.querySelector("p").innerText = data.description;
  })
  .catch((error) => console.error("Erro ao carregar conteúdo:", error));

// GALERIA
fetch("https://tatyana-vanin.onrender.com/content/gallery")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("galeria-container");
    data.images.forEach((url) => {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "Imagem da galeria";
      img.classList.add("imagem-galeria");
      container.appendChild(img);
    });
  })
  .catch((error) => console.error("Erro ao carregar galeria:", error));

// SOBRE MIM
fetch("https://tatyana-vanin.onrender.com/content/about")
  .then((response) => response.json())
  .then((data) => {
    document.querySelector("#about-title").innerText = data.title;
    document.querySelector("#about-description").innerText = data.description;
  })
  .catch((error) => console.error('Erro ao carregar "Sobre Mim":', error));

// BLOG
const postsPerPage = 8;
let currentPage = 1;
let allPosts = [];

function renderPosts() {
  const container = document.getElementById("blog-posts-container");
  container.innerHTML = "";
  const endIndex = postsPerPage * currentPage;
  const visiblePosts = allPosts.slice(0, endIndex);

  visiblePosts.forEach((post) => {
    const imageUrl = `https://tatyana-vanin.onrender.com${post.imageUrl}`;
    const postDate = new Date(post.createdAt);
    const formattedDate = isNaN(postDate)
      ? "Data inválida"
      : postDate.toLocaleDateString("pt-BR");
    const postElement = document.createElement("div");
    postElement.classList.add("post");
    postElement.innerHTML = `
      <img src="${imageUrl}" alt="${post.title}" class="post-image">
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <p class="post-date">Publicado em: ${formattedDate}</p>
      <a href="post.html?id=${post._id}" class="btn-post">Leia Mais</a>
    `;
    container.appendChild(postElement);
  });

  const btnLoadMore = document.getElementById("load-more");
  const btnShowLess = document.getElementById("show-less");

  btnLoadMore.style.display =
    visiblePosts.length < allPosts.length ? "inline-block" : "none";
  btnShowLess.style.display = currentPage > 1 ? "inline-block" : "none";
}

fetch("https://tatyana-vanin.onrender.com/blog")
  .then((response) => response.json())
  .then((posts) => {
    allPosts = posts;
    renderPosts();
  })
  .catch((error) => console.error("Erro ao carregar os posts do blog:", error));

document.getElementById("load-more").addEventListener("click", () => {
  currentPage++;
  renderPosts();
});

document.getElementById("show-less").addEventListener("click", () => {
  currentPage = 1;
  renderPosts();
  window.scrollTo({
    top: document.getElementById("blog-posts-container").offsetTop,
    behavior: "smooth",
  });
});

// DETALHE DO POST
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (!postId) {
  document.getElementById("title").innerText = "ID do post não encontrado.";
  document.getElementById("content").style.display = "none";
} else {
  fetch(`https://tatyana-vanin.onrender.com/blog/${postId}`)
    .then((res) => {
      if (!res.ok) throw new Error("Post não encontrado");
      return res.json();
    })
    .then((post) => {
      document.getElementById("title").innerText = post.title;
      document.getElementById("content").innerText = post.content;
      document.getElementById("date").innerText =
        "Publicado em: " +
        new Date(post.createdAt).toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      if (post.imageUrl) {
        const img = document.getElementById("image");
        // Verifica se a URL da imagem já começa com http, senão adiciona o domínio base
        img.src = post.imageUrl.startsWith("http")
          ? post.imageUrl
          : `https://tatyana-vanin.onrender.com${post.imageUrl}`;
        img.style.display = "block";
      }
    })
    .catch((err) => {
      console.error(err);
      document.getElementById("title").innerText = "Erro ao carregar post.";
      document.getElementById("content").innerText = "";
    });
}

// RODAPÉ - REDES SOCIAIS
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM carregado – iniciando fetch das redes sociais");

  fetch("https://tatyana-vanin.onrender.com/social-links")
    .then((response) => response.json())
    .then((links) => {
      console.log("Links recebidos:", links);

      const socialList = document.querySelector(".rodape-col-4 ul");
      if (!socialList) {
        console.error("Elemento .rodape-col-4 ul não encontrado no DOM!");
        return;
      }

      socialList.innerHTML = "";
      links.forEach((link) => {
        const listItem = document.createElement("li");
        const anchor = document.createElement("a");
        anchor.href = link.url;
        anchor.textContent = link.name;
        anchor.target = "_blank";
        listItem.appendChild(anchor);
        socialList.appendChild(listItem);
      });
    })
    .catch((error) => console.error("Erro ao carregar redes sociais:", error));
});