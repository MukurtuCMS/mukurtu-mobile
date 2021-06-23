import FormData from 'FormData';

export const userAuth = (name, pass, url) => {
  var formData = new FormData();

  name = name.trim();
  pass = pass.trim();
  url = url.toLowerCase().trim();

  formData.append('username', name);
  formData.append('password', pass);

  let data = {
    method: 'POST',
    body: formData,
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
    }
  }
  return fetch(url + '/app/user/login.json', data)
    .then((res) => res.json());
}
