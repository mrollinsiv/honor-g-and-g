module.exports = {
  apps : [
    {
      name: "HonorGandG",
      script: "./app.js",
      watch: true,
      env_production: {
        "NODE_ENV": "production",
      }
    }
  ]
}