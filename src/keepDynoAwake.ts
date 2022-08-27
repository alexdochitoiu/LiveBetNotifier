import { request } from "http";

function wakeUp(): any {
  request("http://obscure-spire-23659.herokuapp.com/", function () {
    console.log("WAKE UP DYNO");
  });
  return setTimeout(wakeUp, 1200000);
}

export default function () {
  setTimeout(wakeUp, 1200000);
}
