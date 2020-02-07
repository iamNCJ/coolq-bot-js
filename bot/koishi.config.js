module.exports = {
  type: "http",
  port: 8080,
  server: "http://localhost:5700",
  plugins: [
    "common",
    "schedule"
  ]
}