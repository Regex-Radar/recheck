import { runAsWorker } from "synckit";
import { check } from "#scalajs/recheck";

runAsWorker(
  async (...args) => {
    return check(...args);
  }
);
