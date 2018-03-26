var instaPics = document.querySelectorAll('.insta-pic');
[...instaPics].forEach(div => {
  var oEmbedURL = 'https://api.instagram.com/oembed/?url=' + div.getAttribute('data-src');
  var instaRequest = new XMLHttpRequest();
  instaRequest.onreadystatechange = function () {
    if (instaRequest.readyState == 4 && instaRequest.status == 200) {
      var response = JSON.parse(instaRequest.responseText);
      div.innerHTML = response.html;
    }
  };
  instaRequest.open('GET', oEmbedURL);
  instaRequest.send();
});