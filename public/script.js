async function uploadFile() {
  const file = document.getElementById('fileInput').files[0];
  if (!file) return alert("Select a .lua file!");

  const formData = new FormData();
  formData.append("luafile", file);

  const res = await fetch('/obfuscate', {
    method: 'POST',
    body: formData
  });

  const result = await res.text();
  document.getElementById('result').textContent = result;
}
