// Promise is used to load both s0501 and b05006 datasets
Promise.all([
  d3.csv("data/s0501.csv"),
  d3.csv("data/b05006.csv")
])