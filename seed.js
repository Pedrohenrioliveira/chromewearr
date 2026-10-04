// node-fetch removed

async function run() {
  const res = await fetch('http://localhost:3000/api/admin/seed');
  const text = await res.text();
  console.log(text);
}
run();
