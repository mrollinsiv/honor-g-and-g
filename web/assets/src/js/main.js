document.addEventListener('DOMContentLoaded', () => {
  const instaPics = document.querySelectorAll('.insta-pic');
  [...instaPics].forEach((div) => {
    const divMod = div;
    const oEmbedURL = `https://api.instagram.com/oembed/?url=${div.getAttribute('data-src')}`;
    const instaRequest = new XMLHttpRequest();
    instaRequest.onreadystatechange = function () {
      if (instaRequest.readyState === 4 && instaRequest.status === 200) {
        const response = JSON.parse(instaRequest.responseText);
        divMod.innerHTML = response.html;
        window.instgrm.Embeds.process();
      }
    };
    instaRequest.open('GET', oEmbedURL);
    instaRequest.send();
  });
});
