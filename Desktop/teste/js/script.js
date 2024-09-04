function getImage(e) {
    let url_api = document.querySelector("#url_api").innerText;
  
    fetch(url_api, { method: "GET" })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        document.querySelector("#json_aqui").innerText = JSON.stringify(data);
  
        let imagem = `<img class="rounded img-fluid" src="${data.message}" />`;
  
        document.querySelector("#imagem_aqui").innerHTML = imagem;
      });
  }
  