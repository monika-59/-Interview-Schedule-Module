const host = window.location.hostname;
console.log("🌐 Running on host:", host);

let apiBaseUrl = '';

if (host === '172.16.1.151') {
  apiBaseUrl = 'http://172.16.1.151:8080/super-admin-erp';
}
else if (host === '122.184.83.139') {
  apiBaseUrl = 'http://122.184.83.139:80/super-admin-erp';
}
else if (host === '101.0.36.60') {
  apiBaseUrl = 'http://101.0.36.60:8080';
}
else if (host === '172.16.1.48') {
  apiBaseUrl = 'http://172.16.1.48:8081/super-admin-erp';
}
else {
  // 🔥 LOCAL DEV (your Python backend)
  apiBaseUrl = 'http://127.0.0.1:8000';
}

export const environment = {
  production: false,
  apiBaseUrl: apiBaseUrl
};