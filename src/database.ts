import mongoose from "mongoose";

function connect() {
  const mongoUri = process.env.DB_CONNECTION_STRING!;
  return mongoose
    .connect(mongoUri)
    .then(() => {
      console.info("[DATABASE]: Mongo database connected!");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { connect };
