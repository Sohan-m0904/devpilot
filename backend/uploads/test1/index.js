import { greetUser } from "./utils/greetings.js";
import Calculator from "./utils/Calculator.js";

function main() {
  greetUser("Sohan");
  const calc = new Calculator();
  console.log("2 + 3 =", calc.add(2, 3));
}

main();
