document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("toggle"); // Definindo o menuToggle
    const dropdown = document.querySelector(".dropdown");
    const dropdownContent = dropdown.querySelector(".dropdown-content");
  
    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation(); // Impede a propagação
      dropdownContent.classList.toggle("active");
    });
  
    // Fecha o menu ao clicar fora
    document.addEventListener("click", function (event) {
      if (
        !menuToggle.contains(event.target) &&
        !dropdownContent.contains(event.target)
      ) {
        dropdownContent.classList.remove("active");
      }
    });
  });